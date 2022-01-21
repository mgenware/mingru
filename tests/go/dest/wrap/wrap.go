package da

import (
	"time"

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

// S ...
func (mrTable *TableTypePost) S(queryable mingru.Queryable, urlName string, id uint64, sig *string, followerCount *string) (int, error) {
	result, err := queryable.Exec("UPDATE `user` SET `url_name` = ?, `sig` = ?, `follower_c` = ? WHERE ? ? ? ?", urlName, sig, followerCount, urlName, id, sig, urlName)
	return mingru.GetRowsAffectedIntWithError(result, err)
}

// T1 ...
func (mrTable *TableTypePost) T1(queryable mingru.Queryable, urlName string, id uint64, followerCount *string) (int, error) {
	return da.S(queryable, urlName, id, "haha", followerCount)
}

// T2 ...
func (mrTable *TableTypePost) T2(queryable mingru.Queryable, id uint64, urlName string, displayName string, age int, followerCount *string) error {
	return User.T(queryable, id, urlName, displayName, "SIG", age, followerCount)
}

// T3 ...
func (mrTable *TableTypePost) T3(queryable mingru.Queryable, id uint64, content string, userID uint64, reviewerID uint64, cmtCount uint, datetime time.Time, date time.Time, time time.Time, nDatetime *time.Time, nDate *time.Time, nTime *time.Time, mUserID uint64) error {
	result, err := queryable.Exec("UPDATE `db_post` SET `title` = ?, `content` = ?, `user_id` = ?, `reviewer_id` = ?, `cmt_c` = ?, `datetime` = ?, `date` = ?, `time` = ?, `n_datetime` = ?, `n_date` = ?, `n_time` = ?, `my_user_id` = ? WHERE `id` = ?", "t3", content, userID, reviewerID, cmtCount, datetime, date, time, nDatetime, nDate, nTime, mUserID, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
