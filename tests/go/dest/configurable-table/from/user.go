package da

import (
	"database/sql"
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type UserAGType struct {
}

var User = &UserAGType{}

// ------------ Actions ------------

func (mrTable *UserAGType) DeleteT(mrQueryable mingru.Queryable, mrFromTable mingru.Table, id uint64) error {
	result, err := mrQueryable.Exec("DELETE FROM "+mrFromTable+" WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

func (mrTable *UserAGType) InsertT(mrQueryable mingru.Queryable, mrFromTable mingru.Table, urlName string, displayName string, sig *string, age int, followerCount *string) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO "+mrFromTable+" (`url_name`, `display_name`, `sig`, `age`, `follower_c`) VALUES (?, ?, ?, ?, ?)", urlName, displayName, sig, age, followerCount)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

type UserTableSelectTResult struct {
	Age int
	ID  uint64
}

func (mrTable *UserAGType) SelectT(mrQueryable mingru.Queryable, mrFromTable mingru.Table) (UserTableSelectTResult, error) {
	var result UserTableSelectTResult
	err := mrQueryable.QueryRow("SELECT `id`, `age` FROM "+mrFromTable).Scan(&result.ID, &result.Age)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *UserAGType) transactTChild2(mrQueryable mingru.Queryable, title string, content string, userID uint64, reviewerID uint64, cmtCount uint, datetime time.Time, date time.Time, time time.Time, nDatetime *time.Time, nDate *time.Time, nTime *time.Time, mUserID uint64) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `db_post` (`title`, `content`, `user_id`, `reviewer_id`, `cmt_c`, `datetime`, `date`, `time`, `n_datetime`, `n_date`, `n_time`, `my_user_id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", title, content, userID, reviewerID, cmtCount, datetime, date, time, nDatetime, nDate, nTime, mUserID)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

func (mrTable *UserAGType) TransactT(db *sql.DB, mrFromTable mingru.Table, urlName string, displayName string, sig *string, age int, followerCount *string, title string, content string, userID uint64, reviewerID uint64, cmtCount uint, datetime time.Time, date time.Time, time time.Time, nDatetime *time.Time, nDate *time.Time, nTime *time.Time, mUserID uint64) error {
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		_, err = mrTable.InsertT(tx, mrFromTable, urlName, displayName, sig, age, followerCount)
		if err != nil {
			return err
		}
		_, err = mrTable.transactTChild2(tx, title, content, userID, reviewerID, cmtCount, datetime, date, time, nDatetime, nDate, nTime, mUserID)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}

func (mrTable *UserAGType) UpdateT(mrQueryable mingru.Queryable, mrFromTable mingru.Table, id uint64, urlName string, displayName string, sig *string, age int, followerCount *string) error {
	result, err := mrQueryable.Exec("UPDATE "+mrFromTable+" SET `url_name` = ?, `display_name` = ?, `sig` = ?, `age` = ?, `follower_c` = ? WHERE `id` = ?", urlName, displayName, sig, age, followerCount, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
