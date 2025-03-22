from typing import Dict, Any, Optional
from supabase import create_client
import os
from dotenv import load_dotenv
import datetime

load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('ANON_SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)

def transfer_money_tool(user_id: str, recipient: str, amount: float, note: Optional[str] = None) -> Dict[str, Any]:
    """
    Perform money transfer function.
    
    Args:
        user_id: Sender ID
        recipient: Recipient name
        amount: Transfer amount
        note: Transfer memo (optional)
        
    Returns:
        Dictionary containing transfer result information
    """
    # 1. Check for fraud possibility
    fraud_check = check_fraud(user_id, recipient, amount)
    if fraud_check["is_suspicious"]:
        return {
            "success": False,
            "message": f"⚠️ Suspicious transaction: {fraud_check['reason']}",
            "suggestion": fraud_check["suggestion"]
        }
    
    # 2. Get user wallet information
    wallet_response = supabase.table('wallets').select('*').eq('user_id', user_id).execute()
    if not wallet_response.data:
        return {
            "success": False,
            "message": "Wallet information not found."
        }
    
    wallet = wallet_response.data[0]
    
    # 3. Check balance
    if wallet["debit_balance"] < amount:
        return {
            "success": False,
            "message": f"Insufficient balance. Current balance: {wallet['debit_balance']} KRW, Required amount: {amount} KRW",
            "balance": wallet["debit_balance"]
        }
    
    # 4. Create transaction record
    transaction_data = {
        "user_id": user_id,
        "amount": amount,
        "recipient": recipient,
        "note": note or f"Transfer to {recipient}",
        "category": "Transfer",
        "transaction_type": "Withdrawal",
        "created_at": datetime.datetime.now().isoformat()
    }
    
    transaction_response = supabase.table('transactions').insert(transaction_data).execute()
    
    if not transaction_response.data:
        return {
            "success": False,
            "message": "An error occurred while creating the transaction record."
        }
    
    # 5. Update wallet balance
    new_balance = wallet["debit_balance"] - amount
    wallet_update = supabase.table('wallets').update({"debit_balance": new_balance}).eq('user_id', user_id).execute()
    
    if not wallet_update.data:
        return {
            "success": False,
            "message": "An error occurred while updating the wallet balance."
        }
    
    # 6. Return success response
    return {
        "success": True,
        "message": f"{amount} KRW has been successfully transferred to {recipient}.",
        "transaction_id": transaction_response.data[0]["id"],
        "new_balance": new_balance,
        "timestamp": datetime.datetime.now().isoformat()
    }

def check_fraud(user_id: str, recipient: str, amount: float) -> Dict[str, Any]:
    """
    Check if a transaction has potential for fraud.
    
    Args:
        user_id: User ID
        recipient: Recipient name
        amount: Transfer amount
        
    Returns:
        Fraud check result
    """
    # 1. Check for large amount (over 500,000 KRW)
    is_large_amount = amount >= 500000
    
    # 2. Check if recipient exists in previous transaction history
    recipient_history = supabase.table('transactions').select('*').eq('user_id', user_id).eq('recipient', recipient).execute()
    is_new_recipient = len(recipient_history.data) == 0
    
    # 3. Check for repeated transfers within 24 hours to the same recipient
    now = datetime.datetime.now()
    yesterday = (now - datetime.timedelta(days=1)).isoformat()
    
    recent_transfers = supabase.table('transactions').select('*').eq('user_id', user_id).eq('recipient', recipient).gte('created_at', yesterday).execute()
    has_recent_transfer = len(recent_transfers.data) > 0
    
    # 4. Determine if suspicious
    is_suspicious = False
    reason = ""
    suggestion = ""
    
    if is_large_amount and is_new_recipient:
        is_suspicious = True
        reason = "This is a large amount and the first transfer to this recipient."
        suggestion = "Verify the recipient information, and consider doing a small test transfer first if needed."
    elif is_large_amount and has_recent_transfer:
        is_suspicious = True
        reason = "This is a large amount and you've already transferred to the same recipient within the last 24 hours."
        suggestion = "Make sure this isn't a duplicate transfer."
    elif is_large_amount:
        is_suspicious = True
        reason = "This is a large amount transfer."
        suggestion = "Double-check if the transfer amount is correct."
        
    return {
        "is_suspicious": is_suspicious,
        "reason": reason,
        "suggestion": suggestion
    }
