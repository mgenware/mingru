package da

import (
	"database/sql"
	"time"

	"github.com/mgenware/mingru-go-lib"
)

// TableTypeUser ...
type TableTypeUser struct {
}

// User ...
var User = &TableTypeUser{}

// ------------ Actions ------------

// DeleteT ...
func (da *TableTypeUser) DeleteT(queryable mingru.Queryable, table string, id uint64) error {
	result, err := queryable.Exec("DELETE FROM "+table+" WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

// InsertT ...
func (da *TableTypeUser) InsertT(queryable mingru.Queryable, table string, urlName string, displayName string, sig *string, age int, followerCount *string) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO "+table+" (`url_name`, `display_name`, `sig`, `age`, `follower_c`) VALUES (?, ?, ?, ?, ?)", table, urlName, displayName, sig, age, followerCount)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

// UserTableSelectTResult ...
type UserTableSelectTResult struct {
	ID  uint64
	Age int
}

// SelectT ...
func (da *TableTypeUser) SelectT(queryable mingru.Queryable, table string) (*UserTableSelectTResult, error) {
	result := &UserTableSelectTResult{}
	err := queryable.QueryRow("SELECT `id`, `age` FROM "+table).Scan(&result.ID, &result.Age)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (da *TableTypeUser) transactTChild2(queryable mingru.Queryable, title string, content string, userID uint64, reviewerID uint64, cmtCount uint, datetime time.Time, date time.Time, time time.Time, nDatetime *time.Time, nDate *time.Time, nTime *time.Time, mUserID uint64) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `db_post` (`title`, `content`, `user_id`, `reviewer_id`, `cmt_c`, `datetime`, `date`, `time`, `n_datetime`, `n_date`, `n_time`, `my_user_id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", title, content, userID, reviewerID, cmtCount, datetime, date, time, nDatetime, nDate, nTime, mUserID)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

// TransactT ...
func (da *TableTypeUser) TransactT(db *sql.DB, table string, urlName string, displayName string, sig *string, age int, followerCount *string, title string, content string, userID uint64, reviewerID uint64, cmtCount uint, datetime time.Time, date time.Time, time time.Time, nDatetime *time.Time, nDate *time.Time, nTime *time.Time, mUserID uint64) error {
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		_, err = da.InsertT(tx, table, urlName, displayName, sig, age, followerCount)
		if err != nil {
			return err
		}
		_, err = da.transactTChild2(tx, title, content, userID, reviewerID, cmtCount, datetime, date, time, nDatetime, nDate, nTime, mUserID)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}

// UpdateT ...
func (da *TableTypeUser) UpdateT(queryable mingru.Queryable, table string, id uint64, urlName string, displayName string, sig *string, age int, followerCount *string) error {
	result, err := queryable.Exec("UPDATE "+table+" SET `url_name` = ?, `display_name` = ?, `sig` = ?, `age` = ?, `follower_c` = ? WHERE `id` = ?", urlName, displayName, sig, age, followerCount, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
