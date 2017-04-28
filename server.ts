const pgPromise = require('pg-promise');
const R         = require('ramda');
const request   = require('request-promise');


// Limit the amount of debugging of SQL expressions
const trimLogsSize : number = 200;

//parse command line arguments
const argv = require('minimist')(process.argv.slice(2));
const username= argv['u'];
const loc= argv['l'];


if(username === undefined && loc === undefined ) {
  console.error("Please profide at least one parameter: -u 'github_username', -l 'location'");
  process.exit(0);

}


// Database interface
interface DBOptions
  { host      : string
  , database  : string
  , user?     : string
  , password? : string
  , port?     : number
  };

// Actual database options
const options : DBOptions = {
  // user: ,
  // password: ,
  host: 'localhost',
  database: 'lovelystay_test',
};


console.info('Connecting to the database:',
  `${options.user}@${options.host}:${options.port}/${options.database}`);

const pgpDefaultConfig = {
  promiseLib: require('bluebird'),
  // Log all querys
  query(query) {
    console.log('[SQL   ]', R.take(trimLogsSize,query.query));
  },
  // On error, please show me the SQL
  error(err, e) {
    if (e.query) {
      console.error('[SQL   ]', R.take(trimLogsSize,e.query),err);
    }
  }
};

interface GithubUsers
  { id : number,
    login: string,
    name: string,
    company: string,
    location: string
  };

const pgp = pgPromise(pgpDefaultConfig);
const db = pgp(options);

//insert user in db
if(username !== undefined) {

    db.none('CREATE TABLE IF NOT EXISTS github_users  (id BIGSERIAL, login TEXT UNIQUE, name TEXT, company TEXT, location TEXT, email TEXT)')
  .then(() => request({
    uri: `https://api.github.com/users/${username}`,
    headers: {
          'User-Agent': 'Request-Promise'
      },
    json: true
  }))
  .then((data: GithubUsers) => db.one(
    `INSERT INTO github_users (login,name,company,location) VALUES ('${data.login}', '${data.name}', '${data.company}', '${data.location}') RETURNING id`, data)
  ).then(({id}) => console.log(id))
   .catch(error => {
        console.error(error);
        process.exit(1);

    })
  .then(() => {
    showStats();
   });

}
//show users by location
if(loc !== undefined) {
  console.info(`========= GitHub users in ${loc} =========`)
  db.each(`SELECT login,name FROM github_users WHERE location LIKE'%${loc}%'`, [], row => {
    row.login += " ";
    ;
  })
    .then((data) => {
        data.map((result:GithubUsers) => {
         console.log(`${result.login}  ${result.name}` );

        });
    })

    .catch(error => {
        console.error(error);
        process.exit(1);

    })
     .then(() => {
        showStats();
     });
 }


//show stats by location
const showStats = function() {
    console.info("========= Stats by location =========")
    db.each(`SELECT location,count(login) FROM github_users group by location`, [], row => {
    row.login += " ";
    ;
  })
    .then(data => {
        data.map(result => {
         console.log(`${result.location}  ${result.count}` );

        });
    })

    .catch(error => {
        console.error(error);
        process.exit(1);

    })
     .then(() => process.exit(0));
}

 

   


