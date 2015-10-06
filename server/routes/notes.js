/*jshint node:true*/
/*jshint esnext:true*/
'use strict';

const marked = require('marked');

marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: true
});

function convertToHTML(text) {
    return marked(text);
}

function *newNote(o, title, text) {
    /* jshint validthis:true */
    var result = yield o.pg.db.client.query_(
            `INSERT INTO notes(text, raw, title)
                VALUES($1, $2, $3)
             RETURNING id, created_at, updated_at;`, [convertToHTML(text), text, title]
        );

    return {
        value: {
            id: result.rows[0].id,
            created: new Date(result.rows[0]['created_at']),
            updated: new Date(result.rows[0]['updated_at'])
        },
        done: true
    };
}

function *getNote(o, id) {
    var result = yield o.pg.db.client.query_(
        `SELECT * FROM notes
            WHERE id=$1 AND (deleted_at IS NULL OR deleted_at > to_timestamp($2))
         LIMIT 1;`,
        [id, +(new Date)]
    );

    return {
        value: result.rows[0],
        done: true
    };
}

function *setNote(o, id, title, text) {
    var result = yield o.pg.db.client.query_(
        `UPDATE notes
            SET title=$1, text=$2, raw=$3, updated_at=now()
         WHERE id=$4`,
        [title, convertToHTML(text), text, id]
    );

    return {
        value: result.rows[0],
        done: true
    };
}

function *deleteNote(o, id) {
    var result = yield o.pg.db.client.query_(
        `UPDATE notes SET deleted_at=now()
            WHERE id=$1
         RETURNING deleted_at;`, [id]
    );

    return {
        value: result.rows[0]['deleted_at'],
        done: true
    };
}

var Notes = function(options) {

    var parse = require('co-body');
    var render = options.render;

    var router = options.router;
    var secureRouter = options.secureRouter;

    function *notes() {
        /* jshint validthis:true */
        var notesData = yield this.pg.db.client.query_(
            `SELECT * FROM notes
                WHERE deleted_at IS NULL OR deleted_at > to_timestamp('${+(new Date)}')
             ORDER BY created_at DESC LIMIT 10;;`
        );
        this.body = yield render('notes/index', {notes: notesData.rows, user: this.session.user, csrf: this.csrf});
    }

    function *note() {
        /* jshint validthis:true */
        var noteData = (yield getNote(this, this.params.id)).value;
        if (noteData) {
            this.body = yield render('notes/note', {note: noteData, user: this.session.user, csrf: this.csrf});
        } else {
            this.state = 404;
        }
    }

    function *createNote() {
        /* jshint validthis:true */
        var body = yield parse(this);

        this.assertCSRF(body);
        var note = (yield newNote(this, body.title, body.text)).value;
        this.redirect(secureRouter.url('note', {id: note.id}));
    }

    function *updateNote() {
        /* jshint validthis:true */
        var id = this.params.id;
        var body = yield parse(this);

        yield setNote(this, this.params.id, body.title, body.text);

        this.redirect(secureRouter.url('note', {id}));
    }

    function *removeNote() {
        /* jshint validthis:true */
        var id = this.params.id;
        var deletedAt = (yield deleteNote(this, id));
        console.log(deletedAt);
        this.redirect(secureRouter.url('notes'));
    }

    router.get('notes', '/notes', notes);
    router.get('note', '/notes/:id', note);

    secureRouter.post('notes', '/notes', createNote);
    secureRouter.post('note', '/notes/:id/update', updateNote);
    secureRouter.post('note', '/notes/:id/delete', removeNote);
    secureRouter.put('note', '/notes/:id', updateNote);
    secureRouter.del('note', '/notes/:id', removeNote);
};

module.exports = Notes;
