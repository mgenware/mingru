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

// MingruSQLName returns the name of this table.
func (mrTable *TableTypeUser) MingruSQLName() string {
	return "user"
}

// ------------ Actions ------------

// DeleteT ...
func (mrTable *TableTypeUser) DeleteT(mrQueryable mingru.Queryable, mrFromTable mingru.Table, id uint64) error {
	result, err := mrQueryable.Exec("DELETE FROM "+mrFromTable.MingruSQLName()+" WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

// InsertT ...
func (mrTable *TableTypeUser) InsertT(mrQueryable mingru.Queryable, mrFromTable mingru.Table, urlName string, displayName string, sig *string, age int, followerCount *string) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO "+mrFromTable.MingruSQLName()+" (`url_name`, `display_name`, `sig`, `age`, `follower_c`) VALUES (?, ?, ?, ?, ?)", urlName, displayName, sig, age, followerCount)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

// UserTableSelectTResult ...
type UserTableSelectTResult struct {
	Age int
	ID  uint64
}

// SelectT ...
func (mrTable *TableTypeUser) SelectT(mrQueryable mingru.Queryable, mrFromTable mingru.Table) (UserTableSelectTResult, error) {
	var result UserTableSelectTResult
	err := mrQueryable.QueryRow("SELECT `id`, `age` FROM "+mrFromTable.MingruSQLName()).Scan(&result.ID, &result.Age)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *TableTypeUser) transactTChild2(mrQueryable mingru.Queryable, mrFromTable mingru.Table, title string, content string, userID uint64, reviewerID uint64, cmtCount uint, datetime time.Time, date time.Time, time time.Time, nDatetime *time.Time, nDate *time.Time, nTime *time.Time, mUserID uint64) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO "+mrFromTable.MingruSQLName()+" (`title`, `content`, `user_id`, `reviewer_id`, `cmt_c`, `datetime`, `date`, `time`, `n_datetime`, `n_date`, `n_time`, `my_user_id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", title, content, userID, reviewerID, cmtCount, datetime, date, time, nDatetime, nDate, nTime, mUserID)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

// TransactT ...
func (mrTable *TableTypeUser) TransactT(db *sql.DB, mrFromTable mingru.Table, urlName string, displayName string, sig *string, age int, followerCount *string, title string, content string, userID uint64, reviewerID uint64, cmtCount uint, datetime time.Time, date time.Time, time time.Time, nDatetime *time.Time, nDate *time.Time, nTime *time.Time, mUserID uint64) error {
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		_, err = mrTable.InsertT(tx, mrFromTable, urlName, displayName, sig, age, followerCount)
		if err != nil {
			return err
		}
		_, err = mrTable.transactTChild2(tx, mrFromTable, title, content, userID, reviewerID, cmtCount, datetime, date, time, nDatetime, nDate, nTime, mUserID)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}

// UpdateT ...
func (mrTable *TableTypeUser) UpdateT(mrQueryable mingru.Queryable, mrFromTable mingru.Table, id uint64, urlName string, displayName string, sig *string, age int, followerCount *string) error {
	result, err := mrQueryable.Exec("UPDATE "+mrFromTable.MingruSQLName()+" SET `url_name` = ?, `display_name` = ?, `sig` = ?, `age` = ?, `follower_c` = ? WHERE `id` = ?", urlName, displayName, sig, age, followerCount, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
