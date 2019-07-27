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

func (da *TableTypePost) insertChild0(queryable dbx.Queryable, id uint64) error {
	return User.UpdatePostCount(queryable, id, 1)
}

func (da *TableTypePost) insertChild2(queryable dbx.Queryable, id uint64, title string) error {
	result, err := queryable.Exec("UPDATE `post` SET `title` = ? WHERE `id` = ?", title, id)
	return dbx.CheckOneRowAffectedWithError(result, err)
}

func (da *TableTypePost) insertChild3(queryable dbx.Queryable, id uint64) error {
	return Post.InsertChild3(queryable, id, TITLE)
}

// Insert ...
func (da *TableTypePost) Insert(db *sql.DB, id uint64, title string) (uint64, error) {
	var insertedID uint64
	txErr := dbx.Transact(db, func(tx *sql.Tx) error {
		var err error
		err = da.InsertChild0(tx, id)
		if err != nil {
			return err
		}
		insertedID, err = da.InsertCore(tx, title)
		if err != nil {
			return err
		}
		err = da.InsertChild2(tx, id, title)
		if err != nil {
			return err
		}
		err = da.InsertChild3(tx, id)
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
