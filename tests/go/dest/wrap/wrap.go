package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type TableTypePost struct {
}

var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

func (mrTable *TableTypePost) S(mrQueryable mingru.Queryable, urlName string, sig *string, followerCount *string, id uint64) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `user` SET `url_name` = ?, `sig` = ?, `follower_c` = ? WHERE ? ? ? ?", urlName, sig, followerCount, urlName, id, sig, urlName)
	return mingru.GetRowsAffectedIntWithError(result, err)
}

func (mrTable *TableTypePost) T1(mrQueryable mingru.Queryable, urlName string, followerCount *string, id uint64) (int, error) {
	return mrTable.S(mrQueryable, urlName, "haha", followerCount, id)
}

func (mrTable *TableTypePost) T2(mrQueryable mingru.Queryable, urlName string, displayName string, age int, followerCount *string, id uint64) error {
	return User.T(mrQueryable, urlName, displayName, "SIG", age, followerCount, id)
}

func (mrTable *TableTypePost) T3(mrQueryable mingru.Queryable, content string, userID uint64, reviewerID uint64, cmtCount uint, datetime time.Time, date time.Time, time time.Time, nDatetime *time.Time, nDate *time.Time, nTime *time.Time, mUserID uint64, id uint64) error {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `title` = ?, `content` = ?, `user_id` = ?, `reviewer_id` = ?, `cmt_c` = ?, `datetime` = ?, `date` = ?, `time` = ?, `n_datetime` = ?, `n_date` = ?, `n_time` = ?, `my_user_id` = ? WHERE `id` = ?", "t3", content, userID, reviewerID, cmtCount, datetime, date, time, nDatetime, nDate, nTime, mUserID, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
