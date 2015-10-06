/*jshint node:true*/
/*jshint esnext:true*/
'use strict';

function buildQuery(args, string) {
    var keys = Object.keys(args);

    console.log(args, string);

    for (var i = keys.length - 1; i >= 0; i--) {
        let key = keys[i];
        console.log(`%${key}`, args[key]);
        string = string.replace(`%${key}`, args[key]);
    }

    return string;
}

var Query = function() {
    this.queryString = '';
    this.queries = {
        select: 'SELECT %fields FROM %table'
    };
};

Query.prototype = {

};

Query.eq = function(value) {
    return `= ${value}`;
};
Query.lt = function(value) {
    return `< ${value}`;
};
Query.gt = function(value) {
    return `> ${value}`;
};
Query.in = function(value) {
    return `IN [${value.join(', ')}]`;
};


/**
 * Builds a select query
 * @param  {string} resourse resourse on which query will be executed
 * @return {[type]}          [description]
 */
Query.prototype.select = function(fields, resourse) {
    let fieldsString = '';
    if (typeof fields === 'string') {
        fieldsString = fields;
    } else {
        fieldsString = fields.join(', ');
    }
    this.queryString = buildQuery({fields: fieldsString, table: `${resourse}`}, this.queries.select);

    return this;
};

Query.prototype.where = function(clauses) {
    if (this.queryString === '') {
        throw new Error('Where clause can\'t be first in query call');
    }

    this.queryString = `${this.queryString} WHERE`;

    if (typeof clauses === 'string') {
        this.queryString = `${this.queryString} ${clauses}`;
        return this;
    }

    let keys = Object.keys(clauses);
    for (var i = keys.length - 1; i >= 0; i--) {
        let key = keys[i];

        this.queryString = `${this.queryString} ${key} ${clauses[key]}`;

        if (i > 0) {
            this.queryString = `${this.queryString} AND`;
        }
    }

    return this;
};

Query.prototype.order = function(field, order) {
    if (this.queryString === '') {
        throw new Error('Where clause can\'t be first in query call');
    }

    this.queryString = `${this.queryString} ORDER BY ${field} ${order || ''}`;

};

Query.prototype.limit = function(amount) {
    if (this.queryString === '') {
        throw new Error('Where clause can\'t be first in query call');
    }

    this.queryString = `${this.queryString} LIMIT ${amount}`;

    return this;
};

Query.prototype.end = function() {
    return `${this.queryString};`;
};

var RB = function() {
    this.resourses = {};
};
// list of data types
//
RB.STRING = 'VARCHAR(255)';
RB.TEXT = 'TEXT';
RB.INT = 'INTEGER';
RB.DOUBLE = 'DOUBLE';
RB.TIMESTAMP = 'TIMESTAMP';
RB.PRIMARY = 'SERIAL PRIMARY KEY';

var replace = function(str) {
    return str.replace(/\.?([A-Z]+)/g, (x,y) => `_${y.toLowerCase()}`).replace(/^_/, '');
};

var Resourse = function(resourseName, dataSet, options) {
    var name = options.persistentName ? resourseName : `${replace(resourseName)}s`;

    var fields = [];
    var createQuery = '';
    var isPrimaryChanged = false;

    var keys = Object.keys(dataSet);
    for (var i = 0; i < keys.length; i++) {
        let key = keys[i];
        let opts = dataSet[key];

        switch (opts.type) {
            case RB.TEXT: {
                fields.push(`${key} ${RB.TEXT}`);
                break;
            }
            case RB.INT: {
                fields.push(`${key} ${RB.INT}`);

                break;
            }
            case RB.DOUBLE: {
                fields.push(`${key} ${RB.DOUBLE}`);

                break;
            }
            case RB.TIMESTAMP: {
                fields.push(`${key} ${RB.TIMESTAMP}`);

                break;
            }
            case RB.PRIMARY: {
                fields.push(`${key} ${RB.PRIMARY}`);
                isPrimaryChanged = true;
                break;
            }
        }
    }

    if (!isPrimaryChanged) {
        fields = [`id ${RB.PRIMARY}`].concat(fields);
    }

    createQuery = `CREATE TABLE ${name}s(${fields.join(', ')});`;

    this.__defineGetter__('name', function() {
        return name;
    });

    this.__defineSetter__('name', function() {
        throw new Error('You are not allowed to change table name after defining a model');
    });

    this.__defineGetter__('query', function() {
        return createQuery;
    });

    this.__defineGetter__('fields', function() {
        return keys;
    });
};

RB.prototype.create = function(resourseName, dataSet, options) {
    var res = new Resourse(resourseName, dataSet, options);
    this.resourses[res.name] = res;
    return res;
};

function *idMock() {
    let id = 0;
    while (true) {
        yield ++id;
    }
}

Resourse.mixin = {
    save: function() {
        let insertQuery = 'INSERT INTO';
        let id = idMock().next();
        let valuesSet = [];

        this.values.id = id.value;
        this.fields.forEach((f) => {
            if (typeof this.values[f] === 'string') {
                this.values[f] = `'${this.values[f]}'`;
            }
            valuesSet.push(this.values[f]);
        });
        return `${insertQuery} ${this.table}(${this.fields.join(', ')}) VALUES (${valuesSet.join(', ')});`;
    },
};

Resourse.prototype.create = function(values) {
    var initial = {
        fields: this.fields,
        table: this.name,
        get new() {
            return (typeof this.id === 'undefined');
        }
    };
    return Object.assign(initial, {values}, Resourse.mixin);
};

Resourse.prototype.delete = function(pKey) {
    1()
};

Resourse.prototype.find = function(clause) {
    return new Query().select('*', this.name).where(clause).end();
};

module.exports = {Query, RB};
