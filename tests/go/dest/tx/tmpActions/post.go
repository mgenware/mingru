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
func (da *TableTypePost) Insert(db *sql.DB, id uint64, title string) (uint64, error) {
	var insertedID uint64
	txErr := dbx.Transact(db, func(tx *sql.Tx) error {
		var err error
		err = User.UpdatePostCount(tx, id, 1)
		if err != nil {
			return err
		}
		insertedID, err = da.InsertCore(tx, title)
		if err != nil {
			return err
		}
		return nil
	})
	return insertedID, txErr
}

// InsertCore ...
func (da *TableTypePost) InsertCore(queryable dbx.Queryable, title string) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `post` (`title`) VALUES (?)", title)
	return dbx.GetLastInsertIDUint64WithError(result, err)
}