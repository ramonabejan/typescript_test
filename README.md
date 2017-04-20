## Typescript Interview Test

1. Install postgres & nodejs
2. Create the test database using the `./createdb.sh` script
3. Install the `npm_modules` for this project running `npm install`
4. Run `npm run test` to get the program running (modify the user and password if needed)
5. Examine the typescript code under `server.ts`

===


test add user with command line argument: 
	
	npm run test -- -u [username]	

test list users by location
	npm run test -- -l [location]
	npm run test -- -l Lisbon

After each command we can see stats by location

