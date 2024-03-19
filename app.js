const express = require('express');
const app = express();
const mysql  = require('mysql2');

// locking a ROUTE
const cookieParser = require('cookie-parser');
const sessions = require('express-session');

const oneHour = 1000 * 60 * 60 * 1;

app.use(cookieParser());

app.use(sessions({
   secret: "myshows14385899",
   saveUninitialized: true,
   cookie: { maxAge: oneHour },
   resave: false
}));
// locking a ROUTE
// *****************




// We should use the createPool() connection method to connect to the MySQL DB 
// rather than a single connection 10 cna be connected. The connectionLimit property specifies the 
// maximum number of connections to create in the pool.  In other words, 10 SQLs in a query queue.
const db = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'webdev2',  //change to your DB name
    port: '8889'
});


// OLD
// db.connect((err)=> {

db.getConnection((err) => {
    if(err) throw err;
});

app.set('view engine', 'ejs');

app.get('/',(req,res) => {

   
   res.render('login');
    
});


// login UI
app.use(express.urlencoded({extended: true}));

app.post('/', (req,res) => {
    const useremail = req.body.emailField;
    const checkuser = `SELECT * FROM my_users WHERE email = "${useremail}" `;
    db.query(checkuser, (err, rows) => {
        if(err) throw err;
        const numRows = rows.length;
        if(numRows > 0){

            // added in - makes it more secure
            const sessionobj = req.session;  
            sessionobj.authen = rows[0].id; 
            // more secure ^^^


            res.redirect('/dashboard');
        }else{
            res.redirect('/');
        //     res.send('<code>logged in</code>');
        // }else{
        //     res.send('<code>accessed denied</code>');
        }
        
    });
});





app.get('/shows',(req,res) => {

    const showsql = `SELECT * FROM my_shows LIMIT 6`;
    
    db.query(showsql, (err, rows1) => {
        if(err) throw err;
        
        // NESTED QUERY
        // this new SQL query is placed inside the first SQL query function
        const actorsql = `SELECT * FROM my_actors ORDER BY actorname DESC LIMIT 4`;
       
        db.query(actorsql, (err2, rows2) => {
           if(err) throw err2;
           res.render('tv', {shows: rows1, actors: rows2});
           
        });

    });
    
});


// LOCKED dashboard 
app.get('/dashboard', (req,res) => {
    const sessionobj = req.session;
    if(sessionobj.authen){

        const uid = sessionobj.authen;
        const user = `SELECT * FROM my_users WHERE id = "${uid}" `;
        
        db.query(user, (err, row)=>{ 
            const firstrow = row[0];
            res.render('dashboard', {userdata:firstrow});
        });
    }else{
        res.send("denied");
    } 
});

// new route with path parameter
// The route path parameter uses the : (colon)  to define that the data 
// can be used by the serverside code
// app.get('/shows/:showid', (req,res) => {
//     const Id = req.params.showid;
//     res.send(`TV shows id in MySQL table is: <b>${Id}</b>. `);
// });

// Add to the route path parameter code (app,js) to query the MySQL table using the promise() method that 
// allows async & await...
app.get('/shows/:showid', async (req,res) => {
    
        const Id = req.params.showid;

        let tvshow = await db.promise().query(`SELECT * FROM my_shows WHERE id = ${Id}`);

        let tvactors = await db.promise().query(`SELECT * FROM my_cast INNER JOIN my_actors ON my_cast.actorid = my_actors.id WHERE my_cast.showid = ${Id};`);

        const sqlres = {
             tv: tvshow[0],
             actors : tvactors[0] 
        }
    
        res.json(sqlres);
    });



app.listen(3003,()=>{
    console.log('Server on port 3003');
});