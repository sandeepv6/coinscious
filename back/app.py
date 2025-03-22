from flask import Flask, jsonify
from supabase import create_client
import os
app = Flask(__name__)

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('ANON_SUPABASE_KEY')
supabase = create_client(supabase_url, supabase_key)

@app.route('/api/data', methods=['GET'])
def get_data():
    # Fetch data from Supabase
    response = supabase.table('users').select('*').execute()
    return jsonify(response.data)

if __name__ == '__main__':
    app.run(debug=True)