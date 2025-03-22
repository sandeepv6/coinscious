from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client
import os
from dotenv import load_dotenv
import random
import datetime
from agent import process_message
from tools.search_notes import save_note_embedding

load_dotenv()

app = Flask(__name__)
# Configure CORS with explicit parameters
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000", "methods": ["GET", "POST", "PUT", "DELETE"], "allow_headers": ["Content-Type"]}})

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('ANON_SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)

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

# 새로운 AI 에이전트 엔드포인트 추가
@app.route('/api/agent', methods=['POST'])
def agent():
    """
    Endpoint for interacting with the AI agent
    """
    data = request.json
    user_id = data.get('user_id')
    message = data.get('input')
    
    if not user_id or not message:
        return jsonify({"error": "User ID and message are required."}), 400
    
    try:
        # Process message through AI agent
        result = process_message(user_id, message)
        
        # Save conversation history
        chat_data = {
            "user_id": user_id,
            "user_message": message,
            "ai_response": result["response"],
            "actions": result.get("actions", []),
            "created_at": datetime.datetime.now().isoformat()
        }
        
        supabase.table('chat_history').insert(chat_data).execute()
        
        return jsonify({
            "response": result["response"],
            "actions": result.get("actions", [])
        })
        
    except Exception as e:
        return jsonify({"error": f"Error processing AI agent request: {str(e)}"}), 500

@app.route('/api/transactions', methods=['POST'])
def create_transaction():
    """
    Endpoint for creating a new transaction
    """
    transaction_data = request.json
    
    if not transaction_data.get('user_id') or not transaction_data.get('amount'):
        return jsonify({"error": "User ID and amount are required."}), 400
    
    try:
        # Save transaction record
        transaction_response = supabase.table('transactions').insert(transaction_data).execute()
        
        if not transaction_response.data:
            return jsonify({"error": "Failed to create transaction"}), 500
        
        created_transaction = transaction_response.data[0]
        
        # Create and save embedding if note exists
        if transaction_data.get('note'):
            save_note_embedding(
                transaction_id=created_transaction['id'],
                note=transaction_data['note'],
                user_id=transaction_data['user_id'],
                amount=transaction_data['amount'],
                category=transaction_data.get('category', 'Other')
            )
        
        return jsonify({
            "success": True, 
            "transaction": created_transaction
        })
        
    except Exception as e:
        return jsonify({"error": f"Error creating transaction: {str(e)}"}), 500

@app.route('/api/transactions/<user_id>', methods=['GET'])
def get_user_transactions(user_id):
    """
    Endpoint for retrieving a user's transaction history
    """
    try:
        # Query transaction history
        response = supabase.table('transactions').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        
        return jsonify({
            "success": True,
            "transactions": response.data
        })
        
    except Exception as e:
        return jsonify({"error": f"Error retrieving transaction history: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)