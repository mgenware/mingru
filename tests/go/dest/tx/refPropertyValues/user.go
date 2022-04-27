package da

import (
	"database/sql"

	"github.com/mgenware/mingru-go-lib"
)

type UserAGType struct {
}

var User = &UserAGType{}

// ------------ Actions ------------

type UserTableTChild1Result struct {
	Age  int
	Name string
}

func (mrTable *UserAGType) tChild1(mrQueryable mingru.Queryable) (UserTableTChild1Result, error) {
	var result UserTableTChild1Result
	err := mrQueryable.QueryRow("SELECT `age`, `name` FROM `user`").Scan(&result.Age, &result.Name)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *UserAGType) tChild2(mrQueryable mingru.Queryable, age int, score int) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `user` (`age`, `score`, `name`) VALUES (?, ?, ?)", age, score, "FOO")
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

func (mrTable *UserAGType) T(db *sql.DB, score int) error {
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		res, err := mrTable.tChild1(tx)
		if err != nil {
			return err
		}
		_, err = mrTable.tChild2(tx, res.Age, score)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}
