import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import SystemMessage, HumanMessage
from langchain_core.tools import tool
from dotenv import load_dotenv
from supabase import create_client
import re
import json
import requests
load_dotenv()


# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('ANON_SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)

# Initialize the chat model
chat_model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")

@tool
def search_history(query: str, user_id: str):
    """Searches the transaction history of the user (user_id) and returns an answer to your query.

    Args:
        query: a question about the user's transaction history
        user_id: the user's user_id
    """
    
    context = get_transac_hist(user_id)
    conversation = [
            SystemMessage(content="You are an accurate document Q&A AI. You provide accurate answers to questions regarding the text below."),
            HumanMessage(content=context),
            HumanMessage(content=query),
            ]
    response = chat_model(conversation)
    return response.content

@tool
def get_user_info(user_id: str):
    """Retrieves the user's personal information from the database.

    Args:
        user_id: the user's user_id
    """
    
    response = supabase.table('users').select('*').eq('user_id', user_id).execute()
    
    if not response.data:
        return "User information not found."
    
    user_data = response.data[0]
    return str(user_data)

@tool
def get_wallet_info(user_id: str):
    """Retrieves the user's wallet information including balances and payment methods.

    Args:
        user_id: the user's user_id
    """
    
    response = supabase.table('wallets').select('*').eq('user_id', user_id).execute()
    
    if not response.data:
        return "Wallet information not found."
    
    wallet_data = response.data[0]
    return str(wallet_data)

@tool
def search_user_by_name(name: str):
    """Searches for users by their name (first name, last name or both) and returns a list of matching users.

    Args:
        name: name or partial name to search for
    """
    # Split name into parts for more flexible search
    name_parts = name.lower().split()
    
    # Get all users
    response = supabase.table('users').select('*').execute()
    users = response.data
    
    # Filter users that match any part of the name
    matching_users = []
    for user in users:
        full_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".lower()
        
        if any(part in full_name for part in name_parts):
            matching_users.append({
                'user_id': user.get('user_id'),
                'first_name': user.get('first_name'),
                'last_name': user.get('last_name')
            })
    
    if not matching_users:
        return "No users found with that name."
    
    return json.dumps(matching_users, ensure_ascii=False)

@tool
def verify_transfer_amount(user_id: str, amount: float):
    """Verifies if the user has sufficient balance to transfer the specified amount.

    Args:
        user_id: the user's user_id
        amount: the amount to transfer
    """
    response = supabase.table('wallets').select('debit_balance').eq('user_id', user_id).execute()
    
    if not response.data:
        return "User's wallet information not found."
    
    balance = response.data[0].get('debit_balance', 0)
    
    if balance < amount:
        return f"Insufficient funds. Current balance: ${balance}, Required amount: ${amount}"
    
    return f"Transfer is possible. Current balance: ${balance}, Transfer amount: ${amount}"

@tool
def transfer_money(sender_id: str, recipient_id: str, amount: float, description: str = "Transfer", confirm_fraud_check: bool = False):
    """Transfers money from one user to another.

    Args:
        sender_id: the sender's user_id
        recipient_id: the recipient's user_id
        amount: the amount to transfer
        description: description of the transfer
        confirm_fraud_check: confirm that fraud check has been performed and user wants to proceed (default: False)
    """
    # 사기 감지 검사
    if not confirm_fraud_check:
        # 이전 거래 내역에서 수신인 확인
        response = supabase.table('transactions').select('*').eq('user_id', sender_id).eq('recipient', recipient_id).execute()
        is_known_recipient = len(response.data) > 0
        
        # 사기 감지 검사 실행
        fraud_check = detect_fraud_keywords(description, amount, is_known_recipient)
        
        # 경고 메시지가 있는 경우 먼저 반환
        if "위험 요소가 감지되지 않았습니다" not in fraud_check:
            return f"{fraud_check}\n\n거래를 계속 진행하려면 confirm_fraud_check=True 매개변수와 함께 다시 호출하세요."
    
    # 송금 API 호출을 위한 데이터 준비
    transfer_data = {
        'sender_id': sender_id,
        'recipient_id': recipient_id,
        'amount': amount,
        'description': description
    }
    
    try:
        # API 호출하여 송금 처리
        response = requests.post('http://localhost:5000/api/transactions/transfer', json=transfer_data)
        
        # 응답 확인
        if response.status_code == 200:
            result = response.json()
            return f"Transfer successful: ${amount} sent from {sender_id} to {recipient_id}. Description: {description}"
        else:
            error_msg = response.json().get('error', 'An unknown error occurred')
            return f"Error during transfer: {error_msg}"
    except Exception as e:
        return f"Error during transfer: {str(e)}"

@tool
def detect_fraud_keywords(message: str, amount: float = 0, is_known_recipient: bool = True):
    """Detect potential fraud by analyzing message content and transaction details.
    
    Args:
        message: The message or transaction description to analyze
        amount: The transfer amount (default: 0)
        is_known_recipient: Whether the recipient is known to the user (default: True)
    
    Returns:
        A string with fraud warning if detected, or confirmation that transaction appears legitimate
    """
    # 금액 관련 위험 요소 확인
    amount_warning = None
    if amount >= 1000:
        amount_warning = f"• 고액 이체 경고: ${amount}는 고액 이체로 간주됩니다."
    
    # 수신인 관련 위험 요소 확인
    recipient_warning = None
    if not is_known_recipient:
        recipient_warning = "• 낯선 수신인 경고: 이전에 거래 내역이 없는 수신인에게 이체하려고 합니다."
    
    # 의심스러운 키워드 목록
    suspicious_keywords = [
        "긴급", "urgent", "emergency", "즉시", "immediately",
        "비밀", "secret", "confidential", "보안", "security",
        "당첨", "lottery", "prize", "reward", "상금",
        "투자", "investment", "수익", "return", "profit",
        "선물", "gift", "카드", "card", "코드", "code",
        "인증", "verification", "verify", "확인", "증명",
        "세금", "tax", "환급", "refund", "return",
        "당신만", "only you", "only for you", "special", "특별",
        "지금", "now", "right now", "바로", "immediately",
        "선불", "prepaid", "선입금", "deposit", "입금",
        "문제", "problem", "issue", "해결", "solve",
        "정부", "government", "공무원", "official", "공식"
    ]
    
    # 메시지에서 의심스러운 키워드 찾기
    found_keywords = []
    for keyword in suspicious_keywords:
        if keyword.lower() in message.lower():
            found_keywords.append(keyword)
    
    keyword_warning = None
    if found_keywords:
        keyword_warning = f"• 의심 키워드 감지: '{', '.join(found_keywords)}' 같은 사기 의심 키워드가 포함되어 있습니다."
    
    # 경고 메시지 생성
    warnings = []
    if amount_warning:
        warnings.append(amount_warning)
    if recipient_warning:
        warnings.append(recipient_warning)
    if keyword_warning:
        warnings.append(keyword_warning)
    
    if warnings:
        warning_message = "🚨 **사기 거래 의심 경고** 🚨\n\n"
        warning_message += "\n".join(warnings)
        warning_message += "\n\n이체를 진행하기 전에 신중하게 확인하세요. 의심스러운 거래라면 즉시 취소하는 것이 좋습니다."
        return warning_message
    
    return "이 거래는 위험 요소가 감지되지 않았습니다."

def get_transac_hist(user_id):
    response = supabase.table('transactions').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
    transactions = response.data

    string = ""
    for transaction in transactions:
        string += f"{transaction['created_at']} | {transaction['description']}; {transaction['note']}: ${transaction['amount']}\n"

    return string[:-1]

def make_conversation(user_id):
    conversation = [
            SystemMessage(content=f"""You are a helpful AI assistant in a bank app. You are an expert in finance and accounting. 
You reply as concisely as possible. The user's id is user_id='{user_id}'.

For transfers, when the user asks to send money to someone (e.g., 'send $500 to my landlord'), follow these steps:
1. First check if you understand who the recipient is. If not, ask for clarification.
2. Search for the recipient using the search_user_by_name tool.
3. If multiple users are found, ask the user to clarify which person they mean.
4. Use the detect_fraud_keywords tool to check for suspicious keywords, high amounts (≥$1000), or unknown recipients.
5. If the fraud detection tool returns warnings, present them to the user and ask for confirmation before proceeding.
6. Verify the sender has sufficient balance using verify_transfer_amount.
7. If all conditions are met, confirm with the user before making the transfer.
8. Use the transfer_money tool only after user confirmation and fraud check.

When the user is asking questions about transactions or requesting a transfer:
- Always be vigilant about potential fraud.
- Use the detect_fraud_keywords tool if the message contains urgent requests, mentions of gifts, investments, lottery, or other suspicious keywords.
- If the transfer amount is $1000 or more, emphasize that this is a large amount and ask for confirmation.
- If the user is sending money to someone they haven't transacted with before, point this out as a potential risk.

All responses should be in English."""),
            ]
    return conversation

def chat_test():
    print("\nGemini Chatbot (type 'exit' to quit)")
    conversation = [SystemMessage(content="You are a helpful AI assistant.")]
    
    while True:
        user_input = input("You: ")
        if user_input.lower() == "exit":
            print("Goodbye!")
            break
        
        conversation.append(HumanMessage(content=user_input))
        response = chat_model(conversation)
        print("Gemini:", response.content)
        
        conversation.append(response)

def extract_transfer_details(message):
    """Extract transfer amount and recipient from message"""
    # Amount extraction pattern (number + $ or number + dollars, etc.)
    amount_pattern = r'(\d+)[\s]*(?:dollars|bucks|\$|\USD)'
    
    # Recipient extraction pattern (to + name or for + name, etc.)
    recipient_pattern = r'(?:to|for)\s+([a-zA-Z\s]+)'
    
    amount_match = re.search(amount_pattern, message)
    recipient_match = re.search(recipient_pattern, message)
    
    amount = float(amount_match.group(1)) if amount_match else None
    recipient = recipient_match.group(1).strip() if recipient_match else None
    
    return amount, recipient

def chat(conversation, message):
    tools = [
        search_history, 
        get_user_info, 
        get_wallet_info, 
        search_user_by_name, 
        verify_transfer_amount, 
        transfer_money,
        detect_fraud_keywords
    ]
    
    agent = chat_model.bind_tools(tools)

    conversation.append(HumanMessage(content=message))
    response = agent.invoke(conversation)

    if not response.content == "" and not response.tool_calls:
        return response.content

    if response.content == "" and response.tool_calls:
        response.content = "Executing tool calls..."
    conversation.append(response)

    for tool_call in response.tool_calls:
        selected_tool = {
            "search_history": search_history,
            "get_user_info": get_user_info,
            "get_wallet_info": get_wallet_info,
            "search_user_by_name": search_user_by_name,
            "verify_transfer_amount": verify_transfer_amount,
            "transfer_money": transfer_money,
            "detect_fraud_keywords": detect_fraud_keywords
        }[tool_call["name"].lower()]
        tool_msg = selected_tool.invoke(tool_call)
        conversation.append(tool_msg)
        print(conversation[-1])

    response = agent.invoke(conversation)

    return response.content

if __name__ == "__main__":
    # Main test selection
    print("Select test mode:")
    print("1. Chat conversation test")
    print("2. Money transfer test")
    choice = input("Selection (1 or 2): ")
    
    if choice == "1":
        chat_test()
    elif choice == "2":
        user_id = input("Enter sender ID: ")
        # Start test conversation
        conversation = make_conversation(user_id)
        
        print("\nVirtual Bank AI Assistant (type 'exit' to quit)")
        
        while True:
            user_input = input("User: ")
            if user_input.lower() == "exit":
                print("Exiting!")
                break
            
            reply = chat(conversation, user_input)
            print(f"AI: {reply}")
    else:
        print("Invalid selection. Exiting program.")

