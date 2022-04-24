package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type TableTypePost struct {
}

var Post = &TableTypePost{}

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

func (mrTable *TableTypePost) SelectT(mrQueryable mingru.Queryable) ([]PostTableSelectTResult, error) {
	rows, err := mrQueryable.Query("SELECT `id`, `title`, `content`, `user_id`, `reviewer_id`, `cmt_c`, `datetime`, `date`, `time`, `n_datetime`, `n_date`, `n_time`, `my_user_id` FROM `db_post` ORDER BY `id`")
	if err != nil {
		return nil, err
	}
	var result []PostTableSelectTResult
	defer rows.Close()
	for rows.Next() {
		var item PostTableSelectTResult
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
