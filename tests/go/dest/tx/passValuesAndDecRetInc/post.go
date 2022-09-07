package da

import (
	"database/sql"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) insertChild1(mrQueryable mingru.Queryable, id uint64) (uint, error) {
	var result uint
	err := mrQueryable.QueryRow("SELECT `count` FROM `post` WHERE `id` = ?", id).Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *PostAGType) insertChild2Core(mrQueryable mingru.Queryable, val uint) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `post` (`count`) VALUES (`count` + ?)", val)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

func (mrTable *PostAGType) insertChild2(mrQueryable mingru.Queryable, val uint) (uint64, error) {
	return mrTable.insertChild2Core(mrQueryable, val)
}

func (mrTable *PostAGType) Insert(db *sql.DB, id uint64) error {
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		val, err := mrTable.insertChild1(tx, id)
		if err != nil {
			return err
		}
		_, err = mrTable.insertChild2(tx, val)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}
