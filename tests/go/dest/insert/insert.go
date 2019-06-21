package da

import (
	"time"

	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// InsertT ...
func (da *TableTypePost) InsertT(queryable dbx.Queryable, title string, userID uint64, content string, cmtCount uint, datetime time.Time, date time.Time, time time.Time, nDatetime *time.Time, nDate *time.Time, nTime *time.Time) error {
	_, err := queryable.Exec("INSERT INTO `post` (`title`, `user_id`, `content`, `cmt_c`, `datetime`, `date`, `time`, `n_datetime`, `n_date`, `n_time`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", title, userID, content, cmtCount, datetime, date, time, nDatetime, nDate, nTime)
	return err
}
