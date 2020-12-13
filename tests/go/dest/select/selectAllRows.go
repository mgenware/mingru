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
func (da *TableTypePost) SelectT(queryable mingru.Queryable) ([]*PostTableSelectTResult, error) {
	rows, err := queryable.Query("SELECT `id`, `title`, `content`, `user_id`, `reviewer_id`, `cmt_c`, `datetime`, `date`, `time`, `n_datetime`, `n_date`, `n_time`, `my_user_id` FROM `db_post` ORDER BY `id`")
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
