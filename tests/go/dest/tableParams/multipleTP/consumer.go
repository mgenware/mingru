package da

import (
	"database/sql"
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type ConsumerAGType struct {
}

var Consumer = &ConsumerAGType{}

// ------------ Actions ------------

func (mrTable *ConsumerAGType) txChild1(mrQueryable mingru.Queryable, urlName string, displayName string, sig *string, age int, followerCount *string) (uint64, error) {
	return Common.Insert(mrQueryable, TableUser, urlName, displayName, sig, age, followerCount)
}

func (mrTable *ConsumerAGType) txChild2(mrQueryable mingru.Queryable, postParam mingru.Table, title string, content string, userID uint64, reviewerID uint64, datetime time.Time, date time.Time, time time.Time, nDatetime *time.Time, nDate *time.Time, nTime *time.Time, mUserID uint64) error {
	_, err := mrQueryable.Exec("INSERT INTO "+string(postParam)+" (`title`, `content`, `user_id`, `reviewer_id`, `cmt_c`, `datetime`, `date`, `time`, `n_datetime`, `n_date`, `n_time`, `my_user_id`) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)", title, content, userID, reviewerID, datetime, date, time, nDatetime, nDate, nTime, mUserID)
	return err
}

func (mrTable *ConsumerAGType) Tx(db *sql.DB, postParam mingru.Table, userParam mingru.Table, urlName string, displayName string, sig *string, age int, followerCount *string, title string, content string, userID uint64, reviewerID uint64, datetime time.Time, date time.Time, time time.Time, nDatetime *time.Time, nDate *time.Time, nTime *time.Time, mUserID uint64, id uint64) error {
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		_, err = mrTable.txChild1(tx, urlName, displayName, sig, age, followerCount)
		if err != nil {
			return err
		}
		err = mrTable.txChild2(tx, postParam, title, content, userID, reviewerID, datetime, date, time, nDatetime, nDate, nTime, mUserID)
		if err != nil {
			return err
		}
		err = Common.Del(tx, userParam, id)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}

func (mrTable *ConsumerAGType) Wrapped(db *sql.DB, postParam mingru.Table, urlName string, displayName string, sig *string, age int, followerCount *string, title string, content string, userID uint64, reviewerID uint64, datetime time.Time, date time.Time, time time.Time, nDatetime *time.Time, nDate *time.Time, nTime *time.Time, mUserID uint64, id uint64) error {
	return mrTable.Tx(db, postParam, TablePost, urlName, displayName, sig, age, followerCount, title, content, userID, reviewerID, datetime, date, time, nDatetime, nDate, nTime, mUserID, id)
}
