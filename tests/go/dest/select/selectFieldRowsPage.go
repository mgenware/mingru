package da

import (
	"fmt"
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

// SelectT ...
func (mrTable *TableTypePost) SelectT(mrQueryable mingru.Queryable, id uint64, page int, pageSize int) ([]*time.Time, bool, error) {
	if page <= 0 {
		err := fmt.Errorf("Invalid page %v", page)
		return nil, false, err
	}
	if pageSize <= 0 {
		err := fmt.Errorf("Invalid page size %v", pageSize)
		return nil, false, err
	}
	limit := pageSize + 1
	offset := (page - 1) * pageSize
	max := pageSize
	rows, err := mrQueryable.Query("SELECT `n_datetime` FROM `db_post` WHERE `id` = ? ORDER BY `id` LIMIT ? OFFSET ?", id, limit, offset)
	if err != nil {
		return nil, false, err
	}
	result := make([]*time.Time, 0, limit)
	itemCounter := 0
	defer rows.Close()
	for rows.Next() {
		itemCounter++
		if itemCounter <= max {
			var item *time.Time
			err = rows.Scan(&item)
			if err != nil {
				return nil, false, err
			}
			result = append(result, item)
		}
	}
	err = rows.Err()
	if err != nil {
		return nil, false, err
	}
	return result, itemCounter > len(result), nil
}
