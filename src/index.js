'use strict';

import _ from 'lodash';
import path from 'path';
import express from 'express';
import info from '../package.json';

import initEnv, { inProduction } from './helpers/environment';
import Paint from './lib/paint';
import errorHandler from './middleware/errors';

initEnv(path.join(__dirname, '../.env'));

const server = express();

// Pretty JSON when not in production
if (!inProduction())
    server.set('json spaces', 2);

server.get('/paint', function getPaint (req, res, next) {
    const source = req.query.source,
        url = req.query.urlvar,
        vars = req.query.var;

    Paint(source, url, vars).then((result) => {
        res.status(200).type('css').send(result);
    }).catch((e) => {
        next ({ code: 500, message: "Compile failed", error: e });
    });
});

server.get('/', function getRoot (req, res) {
	res.status(200).send({ name: info.name, version: info.version });
});

server.use(errorHandler);

server.listen( process.env.PORT );

console.log(
    info.name,
    'is listening with mode',
    process.env.ENVIRONMENT,
    'on port',
    process.env.PORT
);
