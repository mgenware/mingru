package da

import "github.com/mgenware/mingru-go-lib"

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
	ID    uint64
	N     int
	Title string
}

// SelectT ...
func (mrTable *TableTypePost) SelectT(mrQueryable mingru.Queryable, id uint64) ([]PostTableSelectTResult, error) {
	rows, err := mrQueryable.Query("SELECT `id`, RAND() AS `n`, `title` FROM `db_post` WHERE `id` = ? ORDER BY `title`, `n`, `title` DESC, `cmt_c`", id)
	if err != nil {
		return nil, err
	}
	var result []PostTableSelectTResult
	defer rows.Close()
	for rows.Next() {
		var item PostTableSelectTResult
		err = rows.Scan(&item.ID, &item.N, &item.Title)
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
