package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) InsertT(mrQueryable mingru.Queryable, title string, userID uint64, content string, reviewerID uint64, cmtCount uint, datetime time.Time, date time.Time, time time.Time, nDatetime *time.Time, nDate *time.Time, nTime *time.Time, mUserID uint64) error {
	_, err := mrQueryable.Exec("INSERT INTO `db_post` (`title`, `user_id`, `content`, `reviewer_id`, `cmt_c`, `datetime`, `date`, `time`, `n_datetime`, `n_date`, `n_time`, `my_user_id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", title, userID, content, reviewerID, cmtCount, datetime, date, time, nDatetime, nDate, nTime, mUserID)
	return err
}
