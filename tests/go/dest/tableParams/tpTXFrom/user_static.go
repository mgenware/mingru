package da

import (
	"database/sql"
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type UserStaticAGType struct {
}

var UserStatic = &UserStaticAGType{}

// ------------ Actions ------------

func (mrTable *UserStaticAGType) txChild2(mrQueryable mingru.Queryable, postParam mingru.Table, title string, content string, userID uint64, reviewerID uint64, datetime time.Time, date time.Time, time time.Time, nDatetime *time.Time, nDate *time.Time, nTime *time.Time, mUserID uint64) error {
	_, err := mrQueryable.Exec("INSERT INTO "+string(postParam)+" (`title`, `content`, `user_id`, `reviewer_id`, `cmt_c`, `datetime`, `date`, `time`, `n_datetime`, `n_date`, `n_time`, `my_user_id`) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)", title, content, userID, reviewerID, datetime, date, time, nDatetime, nDate, nTime, mUserID)
	return err
}

func (mrTable *UserStaticAGType) Tx(db *sql.DB, postParam mingru.Table, userID uint64, targetID uint64, modelVotes int, title string, content string, reviewerID uint64, datetime time.Time, date time.Time, time time.Time, nDatetime *time.Time, nDate *time.Time, nTime *time.Time, mUserID uint64) error {
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		newID, err := Cmt.Insert(tx, userID, targetID, modelVotes)
		if err != nil {
			return err
		}
		err = mrTable.txChild2(tx, postParam, title, content, newID, reviewerID, datetime, date, time, nDatetime, nDate, nTime, mUserID)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}