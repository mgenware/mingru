package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePost struct {
}

var Post = &TableTypePost{}

// ------------ Actions ------------

type PostTableSelectTResult struct {
	Title  string
	UserID uint64
}

func (mrTable *TableTypePost) SelectT(mrQueryable mingru.Queryable) ([]PostTableSelectTResult, error) {
	rows, err := mrQueryable.Query("SELECT `title`, `user_id` FROM `db_post` ORDER BY `title`, `user_id`, `my_user_id`")
	if err != nil {
		return nil, err
	}
	var result []PostTableSelectTResult
	defer rows.Close()
	for rows.Next() {
		var item PostTableSelectTResult
		err = rows.Scan(&item.Title, &item.UserID)
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
