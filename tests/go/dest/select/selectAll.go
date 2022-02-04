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

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	CmtCount   uint
	Content    string
	Date       time.Time
	Datetime   time.Time
	ID         uint64
	MUserID    uint64
	NDate      *time.Time
	NDatetime  *time.Time
	NTime      *time.Time
	ReviewerID uint64
	Time       time.Time
	Title      string
	UserID     uint64
}

// SelectT ...
func (mrTable *TableTypePost) SelectT(mrQueryable mingru.Queryable) (PostTableSelectTResult, error) {
	var result PostTableSelectTResult
	err := mrQueryable.QueryRow("SELECT `id`, `title`, `content`, `user_id`, `reviewer_id`, `cmt_c`, `datetime`, `date`, `time`, `n_datetime`, `n_date`, `n_time`, `my_user_id` FROM `db_post`").Scan(&result.ID, &result.Title, &result.Content, &result.UserID, &result.ReviewerID, &result.CmtCount, &result.Datetime, &result.Date, &result.Time, &result.NDatetime, &result.NDate, &result.NTime, &result.MUserID)
	if err != nil {
		return result, err
	}
	return result, nil
}
