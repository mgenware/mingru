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
func (da *TableTypePost) SelectT(queryable dbx.Queryable) ([]*PostTableSelectTResult, error) {
	rows, err := queryable.Query("SELECT `id`, `title`, `content`, `user_id`, `reviewer_id`, `cmt_c`, `datetime`, `date`, `time`, `n_datetime`, `n_date`, `n_time`, `my_user_id` FROM `post`")
	if err != nil {
		return nil, err
	}
	result := make([]*PostTableSelectTResult, 0)
	defer rows.Close()
	for rows.Next() {
		item := &PostTableSelectTResult{}
		err = rows.Scan(&item.ID, &item.Title, &item.Content, &item.UserID, &item.ReviewerID, &item.CmtCount, &item.Datetime, &item.Date, &item.Time, &item.NDatetime, &item.NDate, &item.NTime, &item.MUserID)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return result, nil
}
