package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var PostAG = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) SelectT(mrQueryable mingru.Queryable) ([]*time.Time, error) {
	rows, err := mrQueryable.Query("SELECT `n_datetime` FROM `db_post` ORDER BY `id`")
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
