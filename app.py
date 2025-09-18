from flask import Flask, render_template, request, session, jsonify, redirect, url_for
from random import randint
from datetime import timedelta

app = Flask(__name__)
app.secret_key = 'replace-this-with-a-secure-random-key'
app.permanent_session_lifetime = timedelta(days=7)

MAX_ATTEMPTS = 7

def ensure_game():
    if 'target' not in session or 'attempts' not in session:
        session.permanent = True
        session['target'] = randint(1, 100)
        session['attempts'] = 0
        session['history'] = []

@app.route('/')
def index():
    ensure_game()
    return render_template('index.html', attempts_left=MAX_ATTEMPTS - session.get('attempts',0))

@app.route('/api/guess', methods=['POST'])
def api_guess():
    ensure_game()
    data = request.get_json() or {}
    try:
        guess = int(data.get('guess', None))
    except (TypeError, ValueError):
        return jsonify({'status':'error','message':'please submit an integer between 1 and 100.'}), 400

    if not (1 <= guess <= 100):
        return jsonify({'status':'error','message':'guess must be between 1 and 100.'}), 400

    session['attempts'] += 1
    target = session['target']
    diff = guess - target
    if guess == target:
        result = 'correct'
        message = f'congratulations! you guessed the number {target} in {session["attempts"]} attempts.'
        finished = True
    else:
        finished = False
        if session['attempts'] >= MAX_ATTEMPTS:
            result = 'lost'
            message = f'sorry! you have used all {MAX_ATTEMPTS} attempts. the number was {target}.'
            finished = True
        else:
            result = 'low' if guess < target else 'high'
            message = 'too low' if guess < target else 'too high'

    # store history
    session['history'].append({'guess': guess, 'result': result})
    session.modified = True

    return jsonify({
        'status':'ok',
        'result': result,
        'message': message,
        'attempts': session['attempts'],
        'attempts_left': MAX_ATTEMPTS - session['attempts'],
        'history': session['history'],
        'finished': finished
    })

@app.route('/reset', methods=['POST','GET'])
def reset():
    session.pop('target', None)
    session.pop('attempts', None)
    session.pop('history', None)
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
