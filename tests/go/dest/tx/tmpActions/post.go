package da

import (
	"database/sql"

	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// Insert ...
func (da *TableTypePost) Insert(db *sql.DB, id uint64) error {
	txErr := dbx.Transact(db, func(tx *sql.Tx) error {
		var err error
		err = User.UpdatePostCount(tx, id, 1)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}
