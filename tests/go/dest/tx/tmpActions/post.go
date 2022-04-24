package da

import (
	"database/sql"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var PostAG = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) insertChild1(mrQueryable mingru.Queryable, id uint64) error {
	return User.UpdatePostCount(mrQueryable, id, 1)
}

func (mrTable *PostAGType) insertChild3(mrQueryable mingru.Queryable, id uint64, title string) error {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `title` = ? WHERE `id` = ?", title, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

func (mrTable *PostAGType) insertChild4(mrQueryable mingru.Queryable, id uint64) error {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `title` = ? WHERE `id` = ?", id, "TITLE")
	return mingru.CheckOneRowAffectedWithError(result, err)
}

func (mrTable *PostAGType) insertChild5(mrQueryable mingru.Queryable) (uint64, error) {
	return mrTable.InsertCore(mrQueryable, "abc")
}

func (mrTable *PostAGType) Insert(db *sql.DB, id uint64, title string) error {
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		err = mrTable.insertChild1(tx, id)
		if err != nil {
			return err
		}
		_, err = mrTable.InsertCore(tx, title)
		if err != nil {
			return err
		}
		err = mrTable.insertChild3(tx, id, title)
		if err != nil {
			return err
		}
		err = mrTable.insertChild4(tx, id)
		if err != nil {
			return err
		}
		_, err = mrTable.insertChild5(tx)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}

func (mrTable *PostAGType) InsertCore(mrQueryable mingru.Queryable, title string) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `db_post` (`title`) VALUES (?)", title)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
