/*jshint node:true*/
/*jshint esnext:true*/
/*jshint noyield: true*/
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

function *newNote(o, title, text, atMainPage) {
    /* jshint validthis:true */
    var result = yield o.pg.db.client.query_(
            `INSERT INTO notes(text, raw, title, at_main_page)
                VALUES($1, $2, $3, $4)
             RETURNING id, created_at, updated_at;`, [convertToHTML(text), text, title, atMainPage]
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
            WHERE id=$1 AND (deleted_at IS NULL OR deleted_at > now())
         LIMIT 1;`,
        [id]
    );

    return {
        value: result.rows[0],
        done: true
    };
}

function *setNote(o, id, title, text, atMainPage) {
    var result = yield o.pg.db.client.query_(
        `UPDATE notes
            SET title=$1, text=$2, raw=$3, at_main_page=$4, updated_at=now()
         WHERE id=$5`,
        [title, convertToHTML(text), text, atMainPage, id]
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
    var router = options.router;
    var secureRouter = options.secureRouter;

    function *notes() {
        /* jshint validthis:true */
        var notesData = yield this.pg.db.client.query_(
            `SELECT * FROM notes
                WHERE deleted_at IS NULL OR deleted_at > now()
             ORDER BY created_at DESC LIMIT 10;`
        );
        this.body = yield this.render('notes/index', {notes: notesData.rows});
    }

    function *note() {
        /* jshint validthis:true */
        var noteData = (yield getNote(this, this.params.id)).value;
        if (noteData) {
            this.body = yield this.render('notes/note', {note: noteData});
        } else {
            this.state = 404;
        }
    }

    function *createNote() {
        /* jshint validthis:true */
        var body = this.request.body;
        this.assertCSRF(body);
        var note = (yield newNote(this, body.title, body.text, body.atMainPage || false)).value;
        this.redirect(secureRouter.url('note', {id: note.id}));
    }

    function *updateNote() {
        /* jshint validthis:true */
        var id = this.params.id;
        var body = this.request.body;
        yield setNote(this, this.params.id, body.title, body.text, body.atMainPage || false);

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
