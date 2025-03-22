from typing import Dict, Any, Optional
from supabase import create_client
import os
from dotenv import load_dotenv
import datetime
from tools.spending_summary import get_monthly_average

load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('ANON_SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)

def budget_advice_tool(user_id: str, purchase_amount: float, category: Optional[str] = None, description: Optional[str] = None) -> Dict[str, Any]:
    """
    Determine if a purchase is affordable based on budget situation.
    
    Args:
        user_id: User ID
        purchase_amount: Purchase amount
        category: Purchase category (optional)
        description: Purchase description (optional)
        
    Returns:
        Dictionary containing purchase advice
    """
    # 1. Check current balance
    wallet_response = supabase.table('wallets').select('*').eq('user_id', user_id).execute()
    if not wallet_response.data:
        return {
            "success": False,
            "message": "Wallet information not found."
        }
    
    current_balance = wallet_response.data[0]["debit_balance"]
    
    # 2. Check monthly budget information
    budget_response = supabase.table('budget_plans').select('*').eq('user_id', user_id).execute()
    budgets = budget_response.data if budget_response.data else []
    
    # 3. Calculate total spending for the current month
    now = datetime.datetime.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    
    spending_query = supabase.table('transactions').select('*').eq('user_id', user_id).eq('transaction_type', 'Withdrawal').gte('created_at', start_of_month)
    
    if category:
        spending_query = spending_query.eq('category', category)
        
    monthly_spending = spending_query.execute()
    
    # Sum of monthly spending for the category
    category_spent = 0
    if monthly_spending.data:
        category_spent = sum(transaction["amount"] for transaction in monthly_spending.data)
    
    # 4. Calculate monthly average spending
    monthly_average = get_monthly_average(user_id)
    
    # 5. Generate purchase advice
    advice = {}
    
    # 5.1 Check if purchase is affordable with current balance
    can_afford_now = current_balance >= purchase_amount
    
    # 5.2 Check if purchase is within budget plan
    budget_status = "No budget plan"
    remaining_budget = 0
    
    if category and budgets:
        # Find budget for this category
        category_budget = next((b for b in budgets if b["category"] == category), None)
        
        if category_budget:
            budget_limit = category_budget["amount"]
            remaining_budget = budget_limit - category_spent
            within_budget = remaining_budget >= purchase_amount
            
            if within_budget:
                budget_status = f"Within budget (Remaining budget: {remaining_budget:.0f} KRW)"
            else:
                budget_status = f"Exceeds budget (Shortage: {purchase_amount - remaining_budget:.0f} KRW)"
    
    # 5.3 Compare with monthly average spending
    unusual_purchase = purchase_amount > monthly_average * 0.3  # If more than 30% of monthly average, considered a large purchase
    
    # 5.4 Consider upcoming fixed expenses
    fixed_expenses = get_fixed_expenses(user_id)
    total_fixed_expenses = sum(expense["amount"] for expense in fixed_expenses)
    
    # Check if fixed expenses can be covered after purchase
    can_cover_fixed_expenses = (current_balance - purchase_amount) >= total_fixed_expenses
    
    # 6. Overall judgment
    if can_afford_now and (budget_status == f"Within budget (Remaining budget: {remaining_budget:.0f} KRW)" or budget_status == "No budget plan") and can_cover_fixed_expenses:
        recommendation = "Purchase possible"
        reason = "You can afford this purchase with your current balance, it's within your budget plan, and you can cover your fixed expenses."
    elif can_afford_now and can_cover_fixed_expenses:
        recommendation = "Purchase possible (with caution)"
        reason = f"You can afford the purchase, but {budget_status}."
    elif can_afford_now and not can_cover_fixed_expenses:
        recommendation = "Caution needed"
        reason = f"You can make the purchase now, but you might have difficulty covering your fixed expenses ({total_fixed_expenses:.0f} KRW) afterward."
    else:
        recommendation = "Purchase difficult"
        reason = f"Your current balance ({current_balance:.0f} KRW) is not enough to cover the purchase amount ({purchase_amount:.0f} KRW)."
    
    # 7. Return results
    return {
        "success": True,
        "can_afford": can_afford_now,
        "recommendation": recommendation,
        "reason": reason,
        "current_balance": current_balance,
        "purchase_amount": purchase_amount,
        "balance_after_purchase": current_balance - purchase_amount if can_afford_now else current_balance,
        "budget_status": budget_status,
        "remaining_budget": remaining_budget,
        "fixed_expenses": total_fixed_expenses,
        "can_cover_fixed_expenses": can_cover_fixed_expenses,
        "unusual_purchase": unusual_purchase
    }

def get_fixed_expenses(user_id: str) -> list:
    """
    Get the user's fixed expense items.
    
    Args:
        user_id: User ID
        
    Returns:
        List of fixed expense items
    """
    # Query fixed expense items
    fixed_expenses_response = supabase.table('fixed_expenses').select('*').eq('user_id', user_id).execute()
    
    return fixed_expenses_response.data if fixed_expenses_response.data else []
