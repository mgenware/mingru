package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

type PostAGSelectTResult struct {
	Title  string
	UserID uint64
}

func (mrTable *PostAGType) SelectT(mrQueryable mingru.Queryable) ([]PostAGSelectTResult, error) {
	rows, err := mrQueryable.Query("SELECT `title`, `user_id` FROM `db_post` ORDER BY `title`, `user_id`, `my_user_id`")
	if err != nil {
		return nil, err
	}
	var result []PostAGSelectTResult
	defer rows.Close()
	for rows.Next() {
		var item PostAGSelectTResult
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
