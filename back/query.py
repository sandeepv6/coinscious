from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('ANON_SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)

def get_user_by_clerk_id(clerk_id):
    """Get a user by their Clerk ID"""
    response = supabase.table('users').select('*').eq('clerk_id', clerk_id).execute()
    return response.data[0] if response.data else None

def create_user(user_data):
    """Create a new user"""
    response = supabase.table('users').insert(user_data).execute()
    return response.data[0] if response.data else None

def update_user(user_id, user_data):
    """Update a user by ID"""
    response = supabase.table('users').update(user_data).eq('id', user_id).execute()
    return response.data[0] if response.data else None

def get_all_users():
    """Get all users"""
    response = supabase.table('users').select('*').execute()
    return response.data
