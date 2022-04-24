package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePost struct {
}

var Post = &TableTypePost{}

// ------------ Actions ------------

func (mrTable *TableTypePost) SelectT(mrQueryable mingru.Queryable) ([]string, error) {
	rows, err := mrQueryable.Query("SELECT `title` FROM `db_post` ORDER BY `id`")
	if err != nil {
		return nil, err
	}
	var result []string
	defer rows.Close()
	for rows.Next() {
		var item string
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
