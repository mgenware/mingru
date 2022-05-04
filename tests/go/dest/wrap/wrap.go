package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) S(mrQueryable mingru.Queryable, urlName string, id uint64, sig *string, followerCount *string) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `user` SET `url_name` = ?, `sig` = ?, `follower_c` = ? WHERE ? ? ? ?", urlName, sig, followerCount, urlName, id, sig, urlName)
	return mingru.GetRowsAffectedIntWithError(result, err)
}

func (mrTable *PostAGType) T1(mrQueryable mingru.Queryable, urlName string, id uint64, followerCount *string) (int, error) {
	return mrTable.S(mrQueryable, urlName, id, "haha", followerCount)
}

func (mrTable *PostAGType) T2(mrQueryable mingru.Queryable, id uint64, urlName string, displayName string, age int, followerCount *string) error {
	return User.T(mrQueryable, id, urlName, displayName, "SIG", age, followerCount)
}

func (mrTable *PostAGType) t3Core(mrQueryable mingru.Queryable, id uint64, title string, content string, userID uint64, reviewerID uint64, cmtCount uint, datetime time.Time, date time.Time, time time.Time, nDatetime *time.Time, nDate *time.Time, nTime *time.Time, mUserID uint64) error {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `title` = ?, `content` = ?, `user_id` = ?, `reviewer_id` = ?, `cmt_c` = ?, `datetime` = ?, `date` = ?, `time` = ?, `n_datetime` = ?, `n_date` = ?, `n_time` = ?, `my_user_id` = ? WHERE `id` = ?", title, content, userID, reviewerID, cmtCount, datetime, date, time, nDatetime, nDate, nTime, mUserID, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

func (mrTable *PostAGType) T3(mrQueryable mingru.Queryable, id uint64, content string, userID uint64, reviewerID uint64, cmtCount uint, datetime time.Time, date time.Time, time time.Time, nDatetime *time.Time, nDate *time.Time, nTime *time.Time, mUserID uint64) error {
	return mrTable.t3Core(mrQueryable, id, "t3", content, userID, reviewerID, cmtCount, datetime, date, time, nDatetime, nDate, nTime, mUserID)
}
