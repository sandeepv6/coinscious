from typing import Dict, Any, List, Optional
from supabase import create_client
import os
from dotenv import load_dotenv
import datetime
import re

load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('ANON_SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)

# List of fraud suspicious keywords
FRAUD_KEYWORDS = [
    "immediate", "urgent", "investment", "secret", "security", "account confirmation", "deposit request", 
    "winning", "prize", "bitcoin", "cryptocurrency", "fee", "advance payment",
    "foreign remittance", "inheritance", "lottery", "estate", "voice phishing", "instant deposit"
]

def check_fraud_tool(user_id: str, recipient: Optional[str] = None, amount: Optional[float] = None, description: Optional[str] = None) -> Dict[str, Any]:
    """
    Analyze the fraud possibility of a transaction or message.
    
    Args:
        user_id: User ID
        recipient: Recipient (optional)
        amount: Amount (optional)
        description: Message or transaction description (optional)
        
    Returns:
        Dictionary containing fraud analysis results
    """
    risk_factors = []
    risk_level = "low"  # low, medium, high
    
    # 1. Amount related checks
    if amount is not None:
        if amount >= 1000000:  # Over 1,000,000 KRW
            risk_factors.append({
                "type": "high_amount",
                "message": f"⚠️ High value transaction ({amount} KRW)."
            })
            risk_level = "medium"
        
        # Check if different from usual spending patterns
        avg_transaction = get_average_transaction_amount(user_id)
        if amount > avg_transaction * 5:  # More than 5 times the average transaction amount
            risk_factors.append({
                "type": "unusual_amount",
                "message": f"⚠️ Much larger than usual transaction amount ({avg_transaction:.0f} KRW)."
            })
            risk_level = "medium"
    
    # 2. Recipient related checks
    if recipient is not None:
        # Check if it's a first-time recipient
        recipient_history = supabase.table('transactions').select('*').eq('user_id', user_id).eq('recipient', recipient).execute()
        
        if not recipient_history.data:
            risk_factors.append({
                "type": "new_recipient",
                "message": f"⚠️ First-time transfer to '{recipient}'."
            })
            if risk_level == "medium" or amount is not None and amount > 500000:
                risk_level = "high"
            else:
                risk_level = "medium"
        
        # Check if there were multiple transfers to the same recipient within 24 hours
        now = datetime.datetime.now()
        yesterday = (now - datetime.timedelta(days=1)).isoformat()
        
        recent_transfers = supabase.table('transactions').select('*').eq('user_id', user_id).eq('recipient', recipient).gte('created_at', yesterday).execute()
        
        if len(recent_transfers.data) >= 2:
            risk_factors.append({
                "type": "repeated_transfers",
                "message": f"⚠️ {len(recent_transfers.data)} transfers to '{recipient}' in the last 24 hours."
            })
            if risk_level != "high":
                risk_level = "medium"
    
    # 3. Message/description related checks
    if description is not None:
        # Check for suspicious keywords
        found_keywords = []
        for keyword in FRAUD_KEYWORDS:
            if keyword in description.lower():
                found_keywords.append(keyword)
        
        if found_keywords:
            risk_factors.append({
                "type": "suspicious_keywords",
                "message": f"⚠️ Suspicious keywords found: {', '.join(found_keywords)}"
            })
            risk_level = "high"
        
        # Check for account numbers
        if re.search(r'\d{10,14}', description):  # 10-14 digit number pattern
            risk_factors.append({
                "type": "account_number",
                "message": "⚠️ Message contains a number that may be an account number."
            })
            if risk_level != "high":
                risk_level = "medium"
    
    # 4. Determine overall risk level and recommended actions
    recommendations = []
    if risk_level == "high":
        recommendations = [
            "Contact the recipient directly to confirm before proceeding with the transaction.",
            "Report suspicious transactions to your financial institution or the police.",
            "Double-check that the recipient account is correct."
        ]
    elif risk_level == "medium":
        recommendations = [
            "Double-check the transaction information.",
            "Verify that the recipient is correct.",
            "Confirm that the amount is accurate."
        ]
    else:
        recommendations = [
            "This appears to be a safe transaction.",
            "It's always good to review your transaction history."
        ]
    
    # 5. Return results
    return {
        "success": True,
        "is_suspicious": risk_level != "low",
        "risk_level": risk_level,
        "risk_factors": risk_factors,
        "recommendations": recommendations,
        "timestamp": datetime.datetime.now().isoformat()
    }

def get_average_transaction_amount(user_id: str) -> float:
    """
    Calculate the average transaction amount for a user.
    
    Args:
        user_id: User ID
        
    Returns:
        Average transaction amount
    """
    # Query the most recent 30 transactions
    transactions = supabase.table('transactions').select('*').eq('user_id', user_id).limit(30).execute()
    
    if not transactions.data:
        return 0
    
    # Calculate average
    total = sum(transaction["amount"] for transaction in transactions.data)
    return total / len(transactions.data)

def send_fraud_alert(user_id: str, transaction_data: Dict[str, Any], risk_level: str) -> bool:
    """
    Send an alert when a suspicious transaction is detected.
    
    Args:
        user_id: User ID
        transaction_data: Transaction information
        risk_level: Risk level
        
    Returns:
        Alert sending success status
    """
    try:
        # Query user's guardian information
        user_response = supabase.table('users').select('guardian_email').eq('user_id', user_id).execute()
        if not user_response.data or not user_response.data[0]["guardian_email"]:
            return False
        
        guardian_email = user_response.data[0]["guardian_email"]
        
        # Create alert record
        alert_data = {
            "user_id": user_id,
            "type": "fraud_alert",
            "message": f"Suspicious transaction detected with risk level {risk_level}.",
            "transaction_data": transaction_data,
            "risk_level": risk_level,
            "created_at": datetime.datetime.now().isoformat(),
            "guardian_email": guardian_email
        }
        
        supabase.table('alerts').insert(alert_data).execute()
        
        # Actual email/push notification would require a separate service integration
        # (here we're just storing the alert in the database)
        
        return True
        
    except Exception as e:
        print(f"Alert sending error: {str(e)}")
        return False
