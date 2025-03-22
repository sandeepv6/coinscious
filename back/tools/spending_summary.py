from typing import Dict, Any, Optional, List
from supabase import create_client
import os
from dotenv import load_dotenv
import datetime
from collections import defaultdict

load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('ANON_SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)

def spending_summary_tool(user_id: str, period: Optional[str] = "month", category: Optional[str] = None) -> Dict[str, Any]:
    """
    Provide a summary of user's spending.
    
    Args:
        user_id: User ID
        period: Time period ("day", "week", "month", "year")
        category: Specific category (optional)
        
    Returns:
        Dictionary containing spending summary information
    """
    # 1. Calculate start date based on period
    now = datetime.datetime.now()
    start_date = None
    
    if period == "day":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        period_name = "Today"
    elif period == "week":
        start_date = (now - datetime.timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        period_name = "This week"
    elif period == "month":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        period_name = "This month"
    elif period == "year":
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        period_name = "This year"
    else:
        return {
            "success": False,
            "message": "Unsupported period. Use 'day', 'week', 'month', or 'year'."
        }
    
    # 2. Query transaction history
    query = supabase.table('transactions').select('*').eq('user_id', user_id).eq('transaction_type', 'Withdrawal').gte('created_at', start_date)
    
    if category:
        query = query.eq('category', category)
        
    transactions = query.execute()
    
    if not transactions.data:
        return {
            "success": True,
            "message": f"No spending records for {period_name}{' in ' + category + ' category' if category else ''}.",
            "total_amount": 0,
            "transactions_count": 0
        }
    
    # 3. Calculate summary information
    total_amount = sum(transaction["amount"] for transaction in transactions.data)
    category_summary = defaultdict(float)
    
    for transaction in transactions.data:
        category_summary[transaction["category"]] += transaction["amount"]
    
    # Extract top 3 categories by spending
    top_categories = sorted(
        [(cat, amount) for cat, amount in category_summary.items()],
        key=lambda x: x[1],
        reverse=True
    )[:3]
    
    # 4. Return results
    return {
        "success": True,
        "message": f"Spending summary for {period_name}{' in ' + category + ' category' if category else ''}.",
        "period": period_name,
        "total_amount": total_amount,
        "transactions_count": len(transactions.data),
        "top_categories": [{"category": cat, "amount": amount} for cat, amount in top_categories],
        "category_breakdown": [{"category": cat, "amount": amount} for cat, amount in category_summary.items()]
    }

def get_monthly_average(user_id: str) -> float:
    """
    Calculate the monthly average spending for the last 3 months.
    
    Args:
        user_id: User ID
        
    Returns:
        Monthly average spending amount
    """
    now = datetime.datetime.now()
    three_months_ago = (now - datetime.timedelta(days=90)).isoformat()
    
    transactions = supabase.table('transactions').select('*').eq('user_id', user_id).eq('transaction_type', 'Withdrawal').gte('created_at', three_months_ago).execute()
    
    if not transactions.data:
        return 0
    
    total_amount = sum(transaction["amount"] for transaction in transactions.data)
    
    # Calculate number of months (maximum 3 months)
    start_month = datetime.datetime.fromisoformat(transactions.data[-1]["created_at"]).month
    end_month = now.month
    month_diff = (end_month - start_month) % 12 + 1
    month_count = min(month_diff, 3)
    
    return total_amount / month_count
