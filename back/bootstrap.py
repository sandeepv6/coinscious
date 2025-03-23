from note_utils import *
from agent import get_transac_hist
import json
from time import sleep


def update_notes(transaction, notes="No history yet", llm=llm):

    structured_llm = llm.with_structured_output(Notes)
    system_template = """
    You are working on notes you took on the user and user's transaction history. The notes should include ample numbers to track quantitative patterns in their transaction history (including BUT NOT LIMITED TO transaction history and purchase amount). They should not only track quantiative patterns in their transaction history but also qualitative patterns. The notes should not only track transaction history patterns but also insights into the user (including BUT NOT LIMITED TO user habits, preferences, and personality). The notes should be concise and in point form notes, and the tone must be clinical. The notes should be able to capture as much information as you can about the user.
    
    Below are: your current notes and new transactions. You will update your notes given these transactions. You will reorganize and simplify your notes to shorter. Always strive to store the information as concisely as possible without repetition. Remove repetition and details that are redundant and too specific. You will draw broader conclusions. You must analyze the user such as BUT NOT LIMITED TO their personality, likes/dislikes, habits, and other characteristics. DO NOT FORGET TO ACCOUNT FOR THE NEW TRANSACTIONs IN YOUR NOTES.
    """


    prompt_template = ChatPromptTemplate.from_messages(
            [("system", system_template), ("ai", "NOTES:\n{notes}\n\nNEW TRANSACTIONS:\n{transaction}")]
    )

    agent = prompt_template | structured_llm

    #print(prompt_template.invoke({"notes": notes, "transaction": transaction}))
    response = agent.invoke({"notes": notes, "transaction": transaction})
    
    return response.notes


window = 10
notes_to_match = {'0': 'No notes yet.'}
notes_to_match_json = json.dumps(notes_to_match)
response = supabase.table('users').select('user_id').eq('personal_notes', notes_to_match_json).execute()
user_ids = [user["user_id"] for user in response.data]
print("Empties:", user_ids)

for i, user_id in enumerate(user_ids):
    print(f"Generating notes for {i}/{len(user_ids)} {user_id}\n\n")
    response = supabase.table('transactions').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
    transactions = response.data

    notes = ["No notes yet."]
    for j in range(0, len(transactions), window):
        print(f"\n{j}/{len(transactions)} {transactions[j]['description']}")
        transactions_string = ""
        for transaction in transactions[j:j + window]:
            transactions_string += f"{transaction['created_at']} | {transaction['description']}; {transaction['note']}: ${transaction['amount']}\n"
        notes = update_notes(transactions_string, notes)
        print("-", "\n- ".join(notes))
        sleep(10)

    print(notes)
    export_notes(notes, user_id)
