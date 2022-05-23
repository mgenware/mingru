package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) InsertT(mrQueryable mingru.Queryable, content string, reviewerID uint64, cmtCount uint, datetime time.Time, date time.Time, time time.Time, nDatetime *time.Time, nDate *time.Time, nTime *time.Time, mUserID uint64, title string, userID uint64) error {
	_, err := mrQueryable.Exec("INSERT INTO `db_post` (`content`, `reviewer_id`, `cmt_c`, `datetime`, `date`, `time`, `n_datetime`, `n_date`, `n_time`, `my_user_id`, `title`, `user_id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", content, reviewerID, cmtCount, datetime, date, time, nDatetime, nDate, nTime, mUserID, title, userID)
	return err
}
