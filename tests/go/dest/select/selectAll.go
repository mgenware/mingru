package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var PostAG = &PostAGType{}

// ------------ Actions ------------

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

func (mrTable *PostAGType) SelectT(mrQueryable mingru.Queryable) (PostTableSelectTResult, error) {
	var result PostTableSelectTResult
	err := mrQueryable.QueryRow("SELECT `id`, `title`, `content`, `user_id`, `reviewer_id`, `cmt_c`, `datetime`, `date`, `time`, `n_datetime`, `n_date`, `n_time`, `my_user_id` FROM `db_post`").Scan(&result.ID, &result.Title, &result.Content, &result.UserID, &result.ReviewerID, &result.CmtCount, &result.Datetime, &result.Date, &result.Time, &result.NDatetime, &result.NDate, &result.NTime, &result.MUserID)
	if err != nil {
		return result, err
	}
	return result, nil
}
