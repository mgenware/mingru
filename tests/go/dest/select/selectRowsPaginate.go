package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePost struct {
}

var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

type PostTableSelectTResult struct {
	ID    uint64
	Title string
}

func (mrTable *TableTypePost) SelectT(mrQueryable mingru.Queryable, limit int, offset int, max int) ([]PostTableSelectTResult, int, error) {
	rows, err := mrQueryable.Query("SELECT `id`, `title` FROM `db_post` ORDER BY `id` LIMIT ? OFFSET ?", limit, offset)
	if err != nil {
		return nil, 0, err
	}
	result := make([]PostTableSelectTResult, 0, limit)
	itemCounter := 0
	defer rows.Close()
	for rows.Next() {
		itemCounter++
		if itemCounter <= max {
			var item PostTableSelectTResult
			err = rows.Scan(&item.ID, &item.Title)
			if err != nil {
				return nil, 0, err
			}
			result = append(result, item)
		}
	}
	err = rows.Err()
	if err != nil {
		return nil, 0, err
	}
	return result, itemCounter, nil
}
