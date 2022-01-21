package da

import (
	"database/sql"

	"github.com/mgenware/mingru-go-lib"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

func (mrTable *TableTypePost) insertChild1(queryable mingru.Queryable, id uint64) error {
	return User.UpdatePostCount(queryable, id, 1)
}

func (mrTable *TableTypePost) insertChild3(queryable mingru.Queryable, id uint64, title string) error {
	result, err := queryable.Exec("UPDATE `db_post` SET `title` = ? WHERE `id` = ?", title, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

func (mrTable *TableTypePost) insertChild4(queryable mingru.Queryable, id uint64) error {
	result, err := queryable.Exec("UPDATE `db_post` SET `title` = ? WHERE `id` = ?", "TITLE", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

func (mrTable *TableTypePost) insertChild5(queryable mingru.Queryable) (uint64, error) {
	return da.InsertCore(queryable, "abc")
}

// Insert ...
func (mrTable *TableTypePost) Insert(db *sql.DB, id uint64, title string) error {
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		err = da.insertChild1(tx, id)
		if err != nil {
			return err
		}
		_, err = da.InsertCore(tx, title)
		if err != nil {
			return err
		}
		err = da.insertChild3(tx, id, title)
		if err != nil {
			return err
		}
		err = da.insertChild4(tx, id)
		if err != nil {
			return err
		}
		_, err = da.insertChild5(tx)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}

// InsertCore ...
func (mrTable *TableTypePost) InsertCore(queryable mingru.Queryable, title string) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `db_post` (`title`) VALUES (?)", title)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
