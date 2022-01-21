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
func (da *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// SelectT ...
func (da *TableTypePost) SelectT(queryable mingru.Queryable) ([]*time.Time, error) {
	rows, err := queryable.Query("SELECT `n_datetime` FROM `db_post` ORDER BY `id`")
	if err != nil {
		return nil, err
	}
	var result []*time.Time
	defer rows.Close()
	for rows.Next() {
		var item *time.Time
		err = rows.Scan(&item)
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
