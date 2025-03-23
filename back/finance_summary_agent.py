import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import SystemMessage, HumanMessage
from dotenv import load_dotenv
from supabase import create_client
import json
from datetime import datetime, timedelta

load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('ANON_SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)

# Initialize the chat model
chat_model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")

def get_user_transactions(user_id, days=30):
    """Get the user's transactions for the specified time period"""
    # Calculate the date range (last 30 days by default)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Format dates for the query
    start_date_str = start_date.isoformat()
    
    # Query transactions
    response = supabase.table('transactions').select('*')\
        .eq('user_id', user_id)\
        .gte('created_at', start_date_str)\
        .order('created_at', desc=True)\
        .execute()
    
    return response.data

def get_user_wallet(user_id):
    """Get the user's wallet information"""
    response = supabase.table('wallets').select('*').eq('user_id', user_id).execute()
    if response.data:
        return response.data[0]
    return None

def get_user_budgets(user_id):
    """Get the user's budget plans"""
    response = supabase.table('budget_plans').select('*').eq('user_id', user_id).execute()
    return response.data

def generate_financial_summary(user_id):
    """Generate a comprehensive financial summary for the user"""
    # Get user data
    transactions = get_user_transactions(user_id)
    wallet = get_user_wallet(user_id)
    budgets = get_user_budgets(user_id)
    
    # Calculate financial metrics
    total_income = sum([t['amount'] for t in transactions if t['amount'] > 0])
    total_expenses = sum([abs(t['amount']) for t in transactions if t['amount'] < 0])
    
    # Categorize expenses
    expense_categories = {}
    for t in transactions:
        if t['amount'] < 0:
            category = t['category']
            if category not in expense_categories:
                expense_categories[category] = 0
            expense_categories[category] += abs(t['amount'])
    
    # Sort categories by amount
    sorted_categories = sorted(expense_categories.items(), key=lambda x: x[1], reverse=True)
    top_categories = sorted_categories[:3] if len(sorted_categories) >= 3 else sorted_categories
    
    # Create context for the LLM
    context = {
        "transactions": transactions,
        "wallet": wallet,
        "budgets": budgets,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "expense_categories": expense_categories,
        "top_spending_categories": top_categories
    }
    
    # Prompt for summary generation with custom formatting
    summary_prompt = f"""
    As a financial analyst, review the following user financial data and create both a short summary and detailed report.
    
    User's Financial Data:
    - Current Balances: Debit ${wallet['debit_balance']}, Credit ${wallet['credit_balance']}
    - Total Income (30 days): ${total_income}
    - Total Expenses (30 days): ${total_expenses}
    - Top Spending Categories: {top_categories}
    - Number of Transactions: {len(transactions)}
    
    Part 1: Create a brief 3-5 bullet point summary highlighting the most important financial insights.
    Format each point on a new line starting with "HIGHLIGHT: ".
    
    Part 2: Create a comprehensive financial analysis with the following sections:
    
    [SECTION:OVERVIEW]
    Provide a summary of income vs expenses, savings rate, and overall financial health.
    [/SECTION]
    
    [SECTION:SPENDING]
    Analyze the top spending categories and provide insights on spending habits.
    [/SECTION]
    
    [SECTION:BUDGET]
    Compare actual spending to budgets (if available) and highlight areas of concern.
    [/SECTION]
    
    [SECTION:RECOMMENDATIONS]
    Provide 3-5 actionable recommendations to improve financial health.
    [/SECTION]
    
    [SECTION:UNUSUAL]
    Note any unusual activity or patterns in the transaction history.
    [/SECTION]
    
    Use this exact formatting with section tags as shown above.
    """
    
    # Generate the summary
    conversation = [
        SystemMessage(content="You are a financial analyst AI that provides insightful summaries of user financial data."),
        HumanMessage(content=summary_prompt)
    ]
    
    response = chat_model.invoke(conversation)
    content = response.content
    
    # Process the response with custom formatting
    highlights = []
    sections = {}
    
    # Extract highlights
    for line in content.split('\n'):
        if line.strip().startswith('HIGHLIGHT:'):
            highlight = line.strip()[10:].strip()  # Remove the "HIGHLIGHT: " prefix
            if highlight:
                highlights.append(highlight)
    
    # Extract sections
    import re
    section_pattern = r'\[SECTION:(\w+)\](.*?)\[\/SECTION\]'
    section_matches = re.findall(section_pattern, content, re.DOTALL)
    
    for section_name, section_content in section_matches:
        sections[section_name.lower()] = section_content.strip()
    
    # Format the detailed report
    detailed_report = ""
    
    # Add each section with a header
    section_titles = {
        'overview': '## Income and Expense Overview',
        'spending': '## Spending Pattern Analysis',
        'budget': '## Budget Compliance',
        'recommendations': '## Recommendations',
        'unusual': '## Unusual Activity'
    }
    
    for section_key, title in section_titles.items():
        if section_key in sections:
            detailed_report += f"{title}\n\n{sections[section_key]}\n\n"
    
    result = {
        "highlights": highlights,
        "detailed_report": detailed_report
    }
    
    return result

def get_user_id_by_clerk_id(clerk_id):
    """Get the user_id corresponding to a Clerk ID"""
    response = supabase.table('users').select('user_id').eq('clerk_id', clerk_id).execute()
    if response.data:
        return response.data[0]['user_id']
    return None

def generate_summary_by_clerk_id(clerk_id):
    """Generate a financial summary using the Clerk ID"""
    user_id = get_user_id_by_clerk_id(clerk_id)
    if user_id:
        return generate_financial_summary(user_id)
    return {"error": "User not found"}

if __name__ == "__main__":
    # Test the function with a sample user ID
    test_user_id = "user_123"  # Replace with a real user ID for testing
    summary = generate_financial_summary(test_user_id)
    print(json.dumps(summary, indent=2)) 