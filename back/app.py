from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client
import os
from dotenv import load_dotenv
import random
import datetime
from agent import chat, make_conversation
from langchain.schema import SystemMessage
from pinecone import Pinecone, ServerlessSpec

load_dotenv()

app = Flask(__name__)
# Configure CORS with explicit parameters
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000", "methods": ["GET", "POST", "PUT", "DELETE"], "allow_headers": ["Content-Type"]}})

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('ANON_SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)


# ONLY SLIGHT BS
pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))

# TRUE BULLSHIT
conversations = {}




# Add CORS headers to all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response

# Helper functions for wallet creation
def generate_card_number(card_type='debit'):
    """Generate a realistic card number"""
    # Different prefixes for different card types
    prefixes = {
        'debit': ['4', '5'], # Visa (4) or Mastercard (5)
        'credit': ['4', '5', '3'] # Visa, Mastercard, or Amex (3)
    }
    
    prefix = random.choice(prefixes[card_type])
    
    # Generate the rest of the card number
    if prefix == '3':  # Amex has 15 digits
        remaining_digits = 14
    else:  # Visa and Mastercard have 16 digits
        remaining_digits = 15
    
    for _ in range(remaining_digits - 1):
        prefix += str(random.randint(0, 9))
    
    # Calculate the last digit using Luhn algorithm
    digits = [int(d) for d in prefix]
    for i in range(len(digits) - 1, -1, -2):
        digits[i] *= 2
        if digits[i] > 9:
            digits[i] -= 9
    
    check_digit = (10 - sum(digits) % 10) % 10
    
    return prefix + str(check_digit)

def generate_expiry_date():
    """Generate a random expiry date 2-5 years in the future"""
    current_year = datetime.datetime.now().year
    years_ahead = random.randint(2, 5)
    month = random.randint(1, 12)
    
    return f"{month:02d}/{str(current_year + years_ahead)[2:]}"

def generate_cvv():
    """Generate a random CVV"""
    return str(random.randint(100, 999))

@app.route('/api/data', methods=['GET'])
def get_data():
    # Fetch data from Supabase
    response = supabase.table('users').select('*').execute()
    return jsonify(response.data)

@app.route('/api/users', methods=['GET'])
def get_users():
    # Fetch all users from Supabase
    response = supabase.table('users').select('*').execute()
    return jsonify(response.data)

@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    # Fetch specific user from Supabase
    response = supabase.table('users').select('*').eq('id', user_id).execute()
    if response.data:
        return jsonify(response.data[0])
    return jsonify({"error": "User not found"}), 404

@app.route('/api/users', methods=['POST'])
def create_user():
    # Create a new user in Supabase
    user_data = request.json
    
    # Insert user data
    user_response = supabase.table('users').insert(user_data).execute()
    
    if not user_response.data:
        return jsonify({"error": "Failed to create user"}), 500
    
    created_user = user_response.data[0]
    
    # Generate card details for wallet
    debit_card = {
        "card_number": generate_card_number('debit'),
        "expiry_date": generate_expiry_date(),
        "cvv": generate_cvv(),
        "card_type": "debit",
        "card_name": "MyBank Debit Card"
    }
    
    credit_card = {
        "card_number": generate_card_number('credit'),
        "expiry_date": generate_expiry_date(),
        "cvv": generate_cvv(),
        "card_type": "credit",
        "card_name": "MyBank Credit Card",
        "credit_limit": 5000.00
    }
    
    # Create wallet data
    wallet_data = {
        "user_id": created_user['user_id'],
        "debit_balance": 100.00,  # Starting with $100
        "credit_balance": 0.00,   # Starting with $0
        "saving_balance": 0.00,   # Starting with $0
        "payment_methods": {
            "debit_cards": [debit_card],
            "credit_cards": [credit_card]
        }
    }
    
    # Insert wallet data
    wallet_response = supabase.table('wallets').insert(wallet_data).execute()
    
    if not wallet_response.data:
        return jsonify({"error": "User created but failed to create wallet", "user": created_user}), 500
    
    created_wallet = wallet_response.data[0]
    
    # Return both user and wallet data
    return jsonify({
        "user": created_user,
        "wallet": created_wallet
    })

@app.route('/api/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    # Update user in Supabase
    user_data = request.json
    response = supabase.table('users').update(user_data).eq('id', user_id).execute()
    return jsonify(response.data[0])

@app.route('/api/transactions', methods=['POST'])
def create_transaction():
    transaction_data = request.json
    user_id = transaction_data.get('user_id')
    recipient_id = transaction_data.get('recipient_id')
    amount = transaction_data.get('amount')

    # Debug logging
    print(f"Transaction data: {transaction_data}")
    print(f"User ID: {user_id}, Recipient ID: {recipient_id}, Amount: {amount}")

    if not user_id or not recipient_id or not amount:
        return jsonify({"error": "Missing required fields"}), 400

    # Deduct amount from sender's wallet
    sender_wallet_response = supabase.table('wallets').select('*').eq('user_id', user_id).execute()
    if not sender_wallet_response.data:
        return jsonify({"error": "Sender wallet not found"}), 404

    sender_wallet = sender_wallet_response.data[0]
    if sender_wallet['debit_balance'] < amount:
        return jsonify({"error": "Insufficient funds"}), 400

    # Update sender's wallet
    supabase.table('wallets').update({'debit_balance': sender_wallet['debit_balance'] - amount}).eq('user_id', user_id).execute()

    # Add amount to recipient's wallet
    recipient_wallet_response = supabase.table('wallets').select('*').eq('user_id', recipient_id).execute()
    if not recipient_wallet_response.data:
        return jsonify({"error": "Recipient wallet not found"}), 404

    recipient_wallet = recipient_wallet_response.data[0]
    supabase.table('wallets').update({'debit_balance': recipient_wallet['debit_balance'] + amount}).eq('user_id', recipient_id).execute()

    # Create transaction for sender (expense)
    sender_transaction = {
        'user_id': user_id,
        'description': transaction_data.get('description', 'Transfer to recipient'),
        'amount': -amount,
        'category': transaction_data.get('category', 'transfer'),
        'payment_method': transaction_data.get('payment_method', 'debit'),
        'recipient': recipient_id,
        'note': 'Transfer to user {recipient_id}',
        'is_fraud': False
    }
    
    sender_response = supabase.table('transactions').insert(sender_transaction).execute()
    
    if not sender_response.data:
        # Rollback the wallet changes if transaction creation fails
        supabase.table('wallets').update({'debit_balance': sender_wallet['debit_balance']}).eq('user_id', user_id).execute()
        supabase.table('wallets').update({'debit_balance': recipient_wallet['debit_balance']}).eq('user_id', recipient_id).execute()
        return jsonify({"error": "Failed to create sender transaction"}), 500

    # Create transaction for recipient (income)
    recipient_transaction = {
        'user_id': recipient_id,
        'description': transaction_data.get('description', 'Transfer from sender'),
        'amount': amount,
        'category': transaction_data.get('category', 'transfer'),
        'payment_method': transaction_data.get('payment_method', 'debit'),
        'recipient': user_id,
        'note': 'Transfer from user {user_id}',
        'is_fraud': False
    }
    
    recipient_response = supabase.table('transactions').insert(recipient_transaction).execute()
    
    if not recipient_response.data:
        # Log the error but don't rollback since the sender transaction was successful
        print("Failed to create recipient transaction")

    return jsonify({
        "message": "Transaction successful",
        "sender_transaction": sender_response.data[0] if sender_response.data else None,
        "recipient_transaction": recipient_response.data[0] if recipient_response.data else None
    })

@app.route('/api/check-user', methods=['POST'])
def check_user():
    # Check if user exists by first and last name
    user_data = request.json
    first_name = user_data.get('firstName')
    last_name = user_data.get('lastName')
    
    response = supabase.table('users').select('*').eq('first_name', first_name).eq('last_name', last_name).execute()
    
    if response.data:
        return jsonify({"exists": True, "user": response.data[0]})
    return jsonify({"exists": False})

@app.route('/api/check-user-by-clerk/<clerk_id>', methods=['GET'])
def check_user_by_clerk(clerk_id):
    # Check if user exists by Clerk ID
    user_response = supabase.table('users').select('*').eq('clerk_id', clerk_id).execute()
    
    if not user_response.data:
        return jsonify({"exists": False})
    
    user = user_response.data[0]
    
    # Get the user's wallet
    wallet_response = supabase.table('wallets').select('*').eq('user_id', user['user_id']).execute()
    wallet = wallet_response.data[0] if wallet_response.data else None
    
    return jsonify({
        "exists": True, 
        "user": user,
        "wallet": wallet
    })

@app.route('/api/wallets/<user_id>', methods=['GET'])
def get_user_wallet(user_id):
    # Get a user's wallet
    response = supabase.table('wallets').select('*').eq('user_id', user_id).execute()
    
    if response.data:
        return jsonify(response.data[0])
    return jsonify({"error": "Wallet not found"}), 404

@app.route('/api/agent/<user_id>', methods=['POST'])
def get_chat_response(user_id):

    global conversations

    if user_id not in conversations:
        conversations[user_id] = make_conversation(user_id)

    conversation = conversations[user_id]

    message_info = request.json
    message = message_info.get("content")

    reply = chat(conversation, message)

    return jsonify({"response": reply})
  
  
@app.route('/api/transactions/<user_id>', methods=['GET'])
def get_user_transactions(user_id):
    # Get a user's transactions
    response = supabase.table('transactions').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
    
    if response.data:
        # Add a transaction_type field based on whether the user is the recipient
        for transaction in response.data:
            # If the user is the recipient, it's income, otherwise it's an expense
            if transaction.get('recipient') != user_id:
                transaction['transaction_type'] = 'expense'
            else:
                transaction['transaction_type'] = 'income'
        
        return jsonify(response.data)
    return jsonify([])


if __name__ == '__main__':
    app.run(debug=True)
