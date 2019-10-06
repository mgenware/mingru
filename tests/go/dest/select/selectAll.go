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

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	ID         uint64
	Title      string
	Content    string
	UserID     uint64
	ReviewerID uint64
	CmtCount   uint
	Datetime   time.Time
	Date       time.Time
	Time       time.Time
	NDatetime  *time.Time
	NDate      *time.Time
	NTime      *time.Time
	MUserID    uint64
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable) (*PostTableSelectTResult, error) {
	result := &PostTableSelectTResult{}
	err := queryable.QueryRow("SELECT `id`, `title`, `content`, `user_id`, `reviewer_id`, `cmt_c`, `datetime`, `date`, `time`, `n_datetime`, `n_date`, `n_time`, `my_user_id` FROM `db_post`").Scan(&result.ID, &result.Title, &result.Content, &result.UserID, &result.ReviewerID, &result.CmtCount, &result.Datetime, &result.Date, &result.Time, &result.NDatetime, &result.NDate, &result.NTime, &result.MUserID)
	if err != nil {
		return nil, err
	}
	return result, nil
}
