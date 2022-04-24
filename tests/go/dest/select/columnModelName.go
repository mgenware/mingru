package da

import "github.com/mgenware/mingru-go-lib"

type MyTableAGType struct {
}

var MyTableAG = &MyTableAGType{}

// ------------ Actions ------------

type MyTableTableSelectTResult struct {
	MyName string
	MyID   uint64
}

func (mrTable *MyTableAGType) SelectT(mrQueryable mingru.Queryable) ([]MyTableTableSelectTResult, error) {
	rows, err := mrQueryable.Query("SELECT `my_id`, `my_name` FROM `my_table` ORDER BY `id`")
	if err != nil {
		return nil, err
	}
	var result []MyTableTableSelectTResult
	defer rows.Close()
	for rows.Next() {
		var item MyTableTableSelectTResult
		err = rows.Scan(&item.MyID, &item.MyName)
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
