from flask import Flask,render_template,request,redirect,flash,jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import func,desc  # For aggregation
import pymysql
pymysql.install_as_MySQLdb()


app = Flask(__name__)
app.secret_key = "my_super_secret_key"

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://Pratima7517:Chakuli%243065@Pratima7517.mysql.pythonanywhere-services.com/Pratima7517$Pratima7517-BB'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class ExpInfo(db.Model):
    __tablename__ = 'ExpInfo'

    DId = db.Column(db.Integer, primary_key=True)  # <-- primary key
    DDescription = db.Column(db.String(50),nullable=False)
    DAmount = db.Column(db.Integer,nullable=False)
    DCategory = db.Column(db.String(50),nullable=False)
    DDate = db.Column(db.Date,nullable=False)


@app.route("/")
def homePage():
    return render_template('homePage.html')

@app.route("/add", methods=["GET","POST"])
def Add():
    if(request.method=='POST'):
        PDescription = request.form.get('HDescription')
        PAmount = request.form.get('HAmount')
        PCategory = request.form.get('HCategory')
        PDate = request.form.get('HDate')

        print(PDescription, PAmount, PCategory, PDate)


        if PAmount == '':
            # handle empty input
            flash("Amount cannot be empty")
            return redirect('/add')

        PAmount = int(PAmount)
        PDate = datetime.strptime(PDate, "%Y-%m-%d").date()


        entry = ExpInfo(DDescription = PDescription,DAmount = PAmount,DCategory = PCategory,DDate = PDate)
        db.session.add(entry)
        db.session.commit()
        print("Inserted Row:", entry.DId, entry.DDescription, entry.DAmount, entry.DCategory, entry.DDate)

    return render_template('add.html')

@app.route("/dateSheet")
def dateSheet():
    return render_template('lineGraph.html')

@app.route("/recent")
def recent():
    expenses = ExpInfo.query.order_by(ExpInfo.DDate.desc()).all()   # get all rows sorted by date , this is going to be in data base fetching too
    return render_template("Recent.html", expenses=expenses)

@app.route("/edit/<int:DId>", methods=['GET','POST'])
def edit(DId):
    exp = ExpInfo.query.filter_by(DId=DId).first()

    if request.method == 'POST':
        exp.DDescription = request.form.get('HDescription')
        exp.DAmount = request.form.get('HAmount')
        exp.DCategory = request.form.get('HCategory')
        exp.DDate = request.form.get('HDate')

        db.session.commit()
        return redirect(f'/recent')

    return render_template('Edit.html', exp=exp)

@app.route("/delete/<int:DId>", methods=['GET','POST'])
def delete(DId):
    exp = ExpInfo.query.filter_by(DId=DId).first()
    if exp :
        db.session.delete(exp)
        db.session.commit()
    return redirect(f'/recent')


@app.route("/Glance")
def glance():
    return render_template("pieChart.html")


@app.route("/clear-all", methods=['POST'])
def clear_all():
    ExpInfo.query.delete()
    db.session.commit()
    return jsonify({'message': 'All data cleared'})

# Route for line chart data
@app.route("/date-data")
def date_data():
    data = db.session.query(
        func.date(ExpInfo.DDate).label('date'),
        func.sum(ExpInfo.DAmount).label('total')
    ).group_by(func.date(ExpInfo.DDate)).order_by('date').all()

    dates = [row.date.strftime('%Y-%m-%d') for row in data]
    amounts = [int(row.total) for row in data]  # Ensure int
    print(f"Date data: dates={dates}, amounts={amounts}")  # Debug
    return jsonify({'dates': dates, 'amounts': amounts})

# Route for pie chart data
@app.route("/category-data")
def category_data():
    data = db.session.query(
        ExpInfo.DCategory,
        func.sum(ExpInfo.DAmount).label('total')
    ).group_by(ExpInfo.DCategory).all()

    categories = [row.DCategory for row in data]
    amounts = [int(row.total) for row in data]
    print(f"Category data: categories={categories}, amounts={amounts}")  # Debug
    return jsonify({'categories': categories, 'amounts': amounts})

# NEW: Route for total amount
@app.route("/total")
def total():
    total_amount = db.session.query(func.sum(ExpInfo.DAmount)).scalar() or 0
    print(f"Total: {total_amount}")  # Debug
    return jsonify({'total': int(total_amount)})

# NEW: Route for recent expenses (JSON for JS)
@app.route("/recent-data")
def recent_data():
    expenses = ExpInfo.query.order_by(desc(ExpInfo.DDate)).limit(5).all()
    data = [
        {
            'id': exp.DId,
            'description': exp.DDescription,
            'amount': exp.DAmount,
            'category': exp.DCategory,
            'date': exp.DDate.strftime('%Y-%m-%d')
        } for exp in expenses
    ]
    print(f"Recent data: {len(data)} items")  # Debug
    return jsonify({'expenses': data})
if __name__ == '__main__':
    app.run(debug=True)