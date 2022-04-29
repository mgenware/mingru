package da

import (
	"database/sql"

	"github.com/mgenware/mingru-go-lib"
)

type ConsumerAGType struct {
}

var Consumer = &ConsumerAGType{}

// ------------ Actions ------------

func (mrTable *ConsumerAGType) txChild1(mrQueryable mingru.Queryable, urlName string, displayName string, sig *string, age int, followerCount *string) (uint64, error) {
	return UserUtil.Insert(mrQueryable, TableUser, urlName, displayName, sig, age, followerCount)
}

func (mrTable *ConsumerAGType) Tx(db *sql.DB, urlName string, displayName string, sig *string, age int, followerCount *string, mrFromTable mingru.Table, id uint64) error {
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		_, err = mrTable.txChild1(tx, urlName, displayName, sig, age, followerCount)
		if err != nil {
			return err
		}
		err = UserUtil.Del(tx, mrFromTable, id)
		if err != nil {
			return err
		}
		err = UserUtil.Upd(tx, mrFromTable, id, urlName, displayName, sig, age, followerCount)
		if err != nil {
			return err
		}
		_, err = UserUtil.Sel(tx, mrFromTable, id)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}

func (mrTable *ConsumerAGType) Wrapped(db *sql.DB, urlName string, displayName string, sig *string, age int, followerCount *string, id uint64) error {
	return mrTable.Tx(db, urlName, displayName, sig, age, followerCount, TablePost, id)
}
